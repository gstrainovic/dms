-- Row Level Security aktivieren
alter table documents enable row level security;
alter table tags enable row level security;
alter table document_tags enable row level security;
alter table document_fields enable row level security;
alter table document_embeddings enable row level security;
alter table document_schemas enable row level security;

-- Für lokale Entwicklung: Alle Zugriffe erlauben (anon key)
-- In Produktion durch auth.uid() basierte Policies ersetzen

create policy "Allow all access to documents"
  on documents for all
  using (true)
  with check (true);

create policy "Allow all access to tags"
  on tags for all
  using (true)
  with check (true);

create policy "Allow all access to document_tags"
  on document_tags for all
  using (true)
  with check (true);

create policy "Allow all access to document_fields"
  on document_fields for all
  using (true)
  with check (true);

create policy "Allow all access to document_embeddings"
  on document_embeddings for all
  using (true)
  with check (true);

create policy "Allow all access to document_schemas"
  on document_schemas for all
  using (true)
  with check (true);
