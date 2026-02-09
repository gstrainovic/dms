-- Storage Bucket für Dokumente
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- RLS Policy: Authentifizierte User können lesen
create policy "Users can read documents"
  on storage.objects for select
  using (bucket_id = 'documents');

-- RLS Policy: Authentifizierte User können hochladen
create policy "Users can upload documents"
  on storage.objects for insert
  with check (bucket_id = 'documents');

-- RLS Policy: Authentifizierte User können löschen
create policy "Users can delete documents"
  on storage.objects for delete
  using (bucket_id = 'documents');
