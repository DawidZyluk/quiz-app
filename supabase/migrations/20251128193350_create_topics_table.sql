create table topics (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  image_url text,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Set up Row Level Security (RLS)
alter table topics enable row level security;

-- Policy: Users can view their own topics
create policy "Users can view their own topics"
  on topics for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own topics
create policy "Users can insert their own topics"
  on topics for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own topics
create policy "Users can update their own topics"
  on topics for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own topics
create policy "Users can delete their own topics"
  on topics for delete
  using (auth.uid() = user_id);

