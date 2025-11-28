create table user_flashcard_progress (
  user_id uuid references auth.users(id) on delete cascade not null,
  flashcard_id uuid references flashcards(id) on delete cascade not null,
  status text check (status in ('remembered', 'forgotten')) not null,
  last_reviewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, flashcard_id)
);

alter table user_flashcard_progress enable row level security;

create policy "Users can view their own progress"
  on user_flashcard_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert/update their own progress"
  on user_flashcard_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

