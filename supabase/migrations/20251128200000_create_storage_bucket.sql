-- Create a storage bucket for topic images
insert into storage.buckets (id, name, public)
values ('topics', 'topics', true);

-- Policy: Anyone can view topic images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'topics' );

-- Policy: Authenticated users can upload images
create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (
    bucket_id = 'topics' 
    and auth.role() = 'authenticated'
  );

-- Policy: Users can update their own images (optional, but good for maintenance)
create policy "Users can update their own images"
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'topics' );

-- Policy: Users can delete their own images
create policy "Users can delete their own images"
  on storage.objects for delete
  using ( auth.uid() = owner and bucket_id = 'topics' );

