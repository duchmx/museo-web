-- Create a bucket for museum-assets
insert into storage.buckets (id, name, public)
values ('museum-assets', 'museum-assets', true);

-- Enable public access to the bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'museum-assets' );

-- Enable authenticated users to insert/update/delete
create policy "Auth Insert"
  on storage.objects for insert
  with check ( auth.role() = 'authenticated' AND bucket_id = 'museum-assets' );

create policy "Auth Update"
  on storage.objects for update
  using ( auth.role() = 'authenticated' AND bucket_id = 'museum-assets' );

create policy "Auth Delete"
  on storage.objects for delete
  using ( auth.role() = 'authenticated' AND bucket_id = 'museum-assets' );
