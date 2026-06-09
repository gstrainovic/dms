-- Add user_id to documents and tags for multi-user isolation
ALTER TABLE documents ADD COLUMN user_id uuid REFERENCES auth.users(id);
ALTER TABLE tags ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Index for fast user-scoped queries
CREATE INDEX documents_user_id_idx ON documents(user_id);
CREATE INDEX tags_user_id_idx ON tags(user_id);

-- Drop existing "Allow all" policies
DROP POLICY IF EXISTS "Allow all access to documents" ON documents;
DROP POLICY IF EXISTS "Allow all access to tags" ON tags;
DROP POLICY IF EXISTS "Allow all access to document_tags" ON document_tags;
DROP POLICY IF EXISTS "Allow all access to document_fields" ON document_fields;
DROP POLICY IF EXISTS "Allow all access to document_embeddings" ON document_embeddings;
DROP POLICY IF EXISTS "Allow all access to document_schemas" ON document_schemas;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents" ON storage.objects;

-- Documents: user-scoped access
CREATE POLICY "Users can select own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can do everything on documents (for pipeline functions)
CREATE POLICY "Service role full access to documents"
  ON documents FOR ALL
  USING (auth.role() = 'service_role');

-- Tags: user-scoped access
CREATE POLICY "Users can select own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can do everything on tags
CREATE POLICY "Service role full access to tags"
  ON tags FOR ALL
  USING (auth.role() = 'service_role');

-- Document tags: authenticated users via JOIN on documents
CREATE POLICY "Users can manage own document_tags"
  ON document_tags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM documents d WHERE d.id = document_tags.document_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Service role full access to document_tags"
  ON document_tags FOR ALL
  USING (auth.role() = 'service_role');

-- Document fields: via JOIN on documents
CREATE POLICY "Users can manage own document_fields"
  ON document_fields FOR ALL
  USING (EXISTS (
    SELECT 1 FROM documents d WHERE d.id = document_fields.document_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Service role full access to document_fields"
  ON document_fields FOR ALL
  USING (auth.role() = 'service_role');

-- Document embeddings: via JOIN on documents
CREATE POLICY "Users can manage own document_embeddings"
  ON document_embeddings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM documents d WHERE d.id = document_embeddings.document_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Service role full access to document_embeddings"
  ON document_embeddings FOR ALL
  USING (auth.role() = 'service_role');

-- Document schemas: global shared (authenticated read, service_role write)
CREATE POLICY "Authenticated users can read schemas"
  ON document_schemas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access to schemas"
  ON document_schemas FOR ALL
  USING (auth.role() = 'service_role');

-- Authenticated users can also manage schemas (for settings page)
CREATE POLICY "Authenticated users can manage schemas"
  ON document_schemas FOR ALL
  USING (auth.role() = 'authenticated');

-- Storage: authenticated access
CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Service role for storage (pipeline functions)
CREATE POLICY "Service role full access to storage"
  ON storage.objects FOR ALL
  USING (auth.role() = 'service_role');

-- Update hybrid_search to filter by user
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text text,
  query_embedding vector(1024),
  match_count int DEFAULT 20,
  fulltext_weight float DEFAULT 0.4,
  vector_weight float DEFAULT 0.6,
  filter_document_type text DEFAULT NULL,
  filter_tags text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  excerpt text,
  score float,
  match_type text,
  document_type text,
  tags text[]
)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH fulltext_results AS (
    SELECT
      d.id,
      d.title,
      left(d.ocr_text, 300) AS excerpt,
      ts_rank(d.fts, websearch_to_tsquery('german', query_text)) AS rank
    FROM documents d
    WHERE d.fts @@ websearch_to_tsquery('german', query_text)
      AND d.status = 'ready'
      AND d.user_id = auth.uid()
      AND (filter_document_type IS NULL OR d.document_type = filter_document_type)
  ),
  vector_results AS (
    SELECT
      d.id,
      d.title,
      de.chunk_text AS excerpt,
      1 - (de.embedding <=> query_embedding) AS rank
    FROM document_embeddings de
    JOIN documents d ON d.id = de.document_id
    WHERE d.status = 'ready'
      AND d.user_id = auth.uid()
      AND (filter_document_type IS NULL OR d.document_type = filter_document_type)
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  combined AS (
    SELECT
      coalesce(ft.id, vr.id) AS id,
      coalesce(ft.title, vr.title) AS title,
      coalesce(ft.excerpt, vr.excerpt) AS excerpt,
      (coalesce(ft.rank, 0) * fulltext_weight + coalesce(vr.rank, 0) * vector_weight) AS score,
      CASE
        WHEN ft.id IS NOT NULL AND vr.id IS NOT NULL THEN 'hybrid'
        WHEN ft.id IS NOT NULL THEN 'fulltext'
        ELSE 'vector'
      END AS match_type,
      (SELECT d2.document_type FROM documents d2 WHERE d2.id = coalesce(ft.id, vr.id)) AS document_type
    FROM fulltext_results ft
    FULL OUTER JOIN vector_results vr ON ft.id = vr.id
  )
  SELECT
    c.id,
    c.title,
    c.excerpt,
    c.score,
    c.match_type,
    c.document_type,
    array(
      SELECT t.name FROM document_tags dt
      JOIN tags t ON t.id = dt.tag_id
      WHERE dt.document_id = c.id
    ) AS tags
  FROM combined c
  WHERE (filter_tags IS NULL OR EXISTS (
    SELECT 1 FROM document_tags dt
    JOIN tags t ON t.id = dt.tag_id
    WHERE dt.document_id = c.id AND t.name = ANY(filter_tags)
  ))
  ORDER BY c.score DESC
  LIMIT match_count;
$$;

-- Make sha256 unique per user (not globally) so different users can upload same file
DROP INDEX IF EXISTS documents_sha256_idx;
CREATE UNIQUE INDEX documents_sha256_user_idx ON documents(sha256, user_id);

-- Make tag names unique per user (not globally)
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_key;
CREATE UNIQUE INDEX tags_name_user_idx ON tags(name, user_id);
