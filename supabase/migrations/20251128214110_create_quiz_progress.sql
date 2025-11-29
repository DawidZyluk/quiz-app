create table user_quiz_progress (
  user_id uuid references auth.users(id) on delete cascade not null,
  question_id uuid references questions(id) on delete cascade not null,
  is_correct boolean not null,
  attempted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, question_id, attempted_at)
);

alter table user_quiz_progress enable row level security;

create policy "Users can view their own quiz progress"
  on user_quiz_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own quiz progress"
  on user_quiz_progress for insert
  with check (auth.uid() = user_id);

