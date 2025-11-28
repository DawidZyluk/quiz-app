-- Flashcards table
create table flashcards (
  id uuid default gen_random_uuid() primary key,
  topic_id uuid references topics(id) on delete cascade not null,
  question text not null,
  answer text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Quizzes table
create table quizzes (
  id uuid default gen_random_uuid() primary key,
  topic_id uuid references topics(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Questions table
create table questions (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid references quizzes(id) on delete cascade not null,
  question_text text not null,
  question_type text not null check (question_type in ('single_choice', 'multiple_choice')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Answers table
create table answers (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references questions(id) on delete cascade not null,
  answer_text text not null,
  is_correct boolean default false not null
);

-- RLS Policies

-- Flashcards
alter table flashcards enable row level security;

create policy "Users can view their own topic flashcards"
  on flashcards for select
  using (exists (
    select 1 from topics
    where topics.id = flashcards.topic_id
    and topics.user_id = auth.uid()
  ));

create policy "Users can insert flashcards to their own topics"
  on flashcards for insert
  with check (exists (
    select 1 from topics
    where topics.id = flashcards.topic_id
    and topics.user_id = auth.uid()
  ));

create policy "Users can update their own topic flashcards"
  on flashcards for update
  using (exists (
    select 1 from topics
    where topics.id = flashcards.topic_id
    and topics.user_id = auth.uid()
  ));

create policy "Users can delete their own topic flashcards"
  on flashcards for delete
  using (exists (
    select 1 from topics
    where topics.id = flashcards.topic_id
    and topics.user_id = auth.uid()
  ));

-- Quizzes
alter table quizzes enable row level security;

create policy "Users can view their own topic quizzes"
  on quizzes for select
  using (exists (
    select 1 from topics
    where topics.id = quizzes.topic_id
    and topics.user_id = auth.uid()
  ));

create policy "Users can insert quizzes to their own topics"
  on quizzes for insert
  with check (exists (
    select 1 from topics
    where topics.id = quizzes.topic_id
    and topics.user_id = auth.uid()
  ));

create policy "Users can update their own topic quizzes"
  on quizzes for update
  using (exists (
    select 1 from topics
    where topics.id = quizzes.topic_id
    and topics.user_id = auth.uid()
  ));

create policy "Users can delete their own topic quizzes"
  on quizzes for delete
  using (exists (
    select 1 from topics
    where topics.id = quizzes.topic_id
    and topics.user_id = auth.uid()
  ));

-- Questions
alter table questions enable row level security;

create policy "Users can manage questions via quizzes"
  on questions for all
  using (exists (
    select 1 from quizzes
    join topics on topics.id = quizzes.topic_id
    where quizzes.id = questions.quiz_id
    and topics.user_id = auth.uid()
  ));

-- Answers
alter table answers enable row level security;

create policy "Users can manage answers via questions"
  on answers for all
  using (exists (
    select 1 from questions
    join quizzes on quizzes.id = questions.quiz_id
    join topics on topics.id = quizzes.topic_id
    where questions.id = answers.question_id
    and topics.user_id = auth.uid()
  ));

