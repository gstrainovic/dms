-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Document schemas (predefined Zod schemas per document type)
create table document_schemas (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  document_type text not null unique,
  schema jsonb not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documents
create table documents (
  id uuid primary key default uuid_generate_v4(),
  title text not null default '',
  original_filename text not null,
  mime_type text not null,
  file_size bigint not null,
  storage_path text not null,
  ocr_storage_path text,
  sha256 text not null,
  ocr_text text,
  document_type text,
  schema_id uuid references document_schemas(id) on delete set null,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'ocr_done', 'extracted', 'ready', 'error')),
  error_message text,
  page_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Full-text search index (German)
alter table documents add column fts tsvector
  generated always as (
    setweight(to_tsvector('german', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(ocr_text, '')), 'B')
  ) stored;

create index documents_fts_idx on documents using gin(fts);
create unique index documents_sha256_idx on documents(sha256);
create index documents_status_idx on documents(status);
create index documents_document_type_idx on documents(document_type);

-- Tags
create table tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  color text default '#6366f1',
  created_at timestamptz not null default now()
);

-- Document-Tag junction (many-to-many with AI confidence)
create table document_tags (
  document_id uuid not null references documents(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  confidence real default 1.0,
  source text not null default 'ai'
    check (source in ('ai', 'manual')),
  created_at timestamptz not null default now(),
  primary key (document_id, tag_id)
);

create index document_tags_tag_id_idx on document_tags(tag_id);

-- Document fields (key-value extracted data, hybrid: predefined/dynamic)
create table document_fields (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  field_name text not null,
  field_value text,
  field_type text not null default 'text'
    check (field_type in ('text', 'number', 'date', 'currency', 'boolean')),
  confidence real default 1.0,
  source text not null default 'ai'
    check (source in ('ai', 'manual')),
  created_at timestamptz not null default now()
);

create unique index document_fields_unique_idx on document_fields(document_id, field_name);
create index document_fields_document_id_idx on document_fields(document_id);

-- Document embeddings (pgvector chunks, 1024-dim Mistral Embed)
create table document_embeddings (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index integer not null,
  chunk_text text not null,
  embedding vector(1024) not null,
  created_at timestamptz not null default now()
);

create index document_embeddings_document_id_idx on document_embeddings(document_id);
create index document_embeddings_vector_idx on document_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Hybrid search function
create or replace function hybrid_search(
  query_text text,
  query_embedding vector(1024),
  match_count int default 20,
  fulltext_weight float default 0.4,
  vector_weight float default 0.6,
  filter_document_type text default null,
  filter_tags text[] default null
)
returns table (
  id uuid,
  title text,
  excerpt text,
  score float,
  match_type text,
  document_type text,
  tags text[]
)
language sql stable
as $$
  with fulltext_results as (
    select
      d.id,
      d.title,
      left(d.ocr_text, 300) as excerpt,
      ts_rank(d.fts, websearch_to_tsquery('german', query_text)) as rank
    from documents d
    where d.fts @@ websearch_to_tsquery('german', query_text)
      and d.status = 'ready'
      and (filter_document_type is null or d.document_type = filter_document_type)
  ),
  vector_results as (
    select
      d.id,
      d.title,
      de.chunk_text as excerpt,
      1 - (de.embedding <=> query_embedding) as rank
    from document_embeddings de
    join documents d on d.id = de.document_id
    where d.status = 'ready'
      and (filter_document_type is null or d.document_type = filter_document_type)
    order by de.embedding <=> query_embedding
    limit match_count * 2
  ),
  combined as (
    select
      coalesce(ft.id, vr.id) as id,
      coalesce(ft.title, vr.title) as title,
      coalesce(ft.excerpt, vr.excerpt) as excerpt,
      (coalesce(ft.rank, 0) * fulltext_weight + coalesce(vr.rank, 0) * vector_weight) as score,
      case
        when ft.id is not null and vr.id is not null then 'hybrid'
        when ft.id is not null then 'fulltext'
        else 'vector'
      end as match_type,
      (select d2.document_type from documents d2 where d2.id = coalesce(ft.id, vr.id)) as document_type
    from fulltext_results ft
    full outer join vector_results vr on ft.id = vr.id
  )
  select
    c.id,
    c.title,
    c.excerpt,
    c.score,
    c.match_type,
    c.document_type,
    array(
      select t.name from document_tags dt
      join tags t on t.id = dt.tag_id
      where dt.document_id = c.id
    ) as tags
  from combined c
  where (filter_tags is null or exists (
    select 1 from document_tags dt
    join tags t on t.id = dt.tag_id
    where dt.document_id = c.id and t.name = any(filter_tags)
  ))
  order by c.score desc
  limit match_count;
$$;

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at();

create trigger document_schemas_updated_at
  before update on document_schemas
  for each row execute function update_updated_at();

-- Insert default schemas
insert into document_schemas (name, document_type, schema, description) values
  ('Rechnung', 'invoice', '{
    "type": "object",
    "properties": {
      "rechnungsnummer": {"type": "string"},
      "datum": {"type": "string", "format": "date"},
      "faellig_am": {"type": "string", "format": "date"},
      "absender": {"type": "string"},
      "empfaenger": {"type": "string"},
      "nettobetrag": {"type": "number"},
      "mwst_betrag": {"type": "number"},
      "bruttobetrag": {"type": "number"},
      "waehrung": {"type": "string", "default": "EUR"},
      "iban": {"type": "string"}
    },
    "required": ["bruttobetrag"]
  }', 'Schema für Rechnungen und Belege'),
  ('Vertrag', 'contract', '{
    "type": "object",
    "properties": {
      "vertragsart": {"type": "string"},
      "vertragspartner": {"type": "string"},
      "beginn": {"type": "string", "format": "date"},
      "ende": {"type": "string", "format": "date"},
      "kuendigungsfrist": {"type": "string"},
      "betrag": {"type": "number"},
      "intervall": {"type": "string"}
    }
  }', 'Schema für Verträge'),
  ('Arztbrief', 'medical_letter', '{
    "type": "object",
    "properties": {
      "arzt": {"type": "string"},
      "patient": {"type": "string"},
      "datum": {"type": "string", "format": "date"},
      "diagnose": {"type": "string"},
      "befund": {"type": "string"},
      "therapie": {"type": "string"}
    }
  }', 'Schema für Arztbriefe und medizinische Dokumente');
