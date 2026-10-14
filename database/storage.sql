-- Image bucket for garment photos. Run in the Supabase SQL editor after schema.sql.
-- Public read, authenticated write, jpg/png/webp, max 2 MB (project requirements, section 9.8).
-- Not yet run against a real Supabase project; if a column below is rejected,
-- create the bucket in the dashboard with the same settings instead.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('garment-images', 'garment-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "garment images: authenticated upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'garment-images');
