-- Create decks table
create table flashcard_decks (
  id uuid default gen_random_uuid() primary key,
  topic_id uuid references topics(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Drop policies dependent on topic_id FIRST
drop policy "Users can view their own topic flashcards" on flashcards;
drop policy "Users can insert flashcards to their own topics" on flashcards;
drop policy "Users can update their own topic flashcards" on flashcards;
drop policy "Users can delete their own topic flashcards" on flashcards;

-- Now modify flashcards table to reference decks
alter table flashcards 
  drop column topic_id,
  add column deck_id uuid references flashcard_decks(id) on delete cascade not null;

-- Enable RLS on decks
alter table flashcard_decks enable row level security;

-- Policies for decks
create policy "Users can view their own topic decks"
  on flashcard_decks for select
  using (exists (
    select 1 from topics
    where topics.id = flashcard_decks.topic_id
    and topics.user_id = auth.uid()
  ));

create policy "Users can insert decks to their own topics"
  on flashcard_decks for insert
  with check (exists (
    select 1 from topics
    where topics.id = flashcard_decks.topic_id
    and topics.user_id = auth.uid()
  ));

create policy "Users can update their own topic decks"
  on flashcard_decks for update
  using (exists (
    select 1 from topics
    where topics.id = flashcard_decks.topic_id
    and topics.user_id = auth.uid()
  ));

create policy "Users can delete their own topic decks"
  on flashcard_decks for delete
  using (exists (
    select 1 from topics
    where topics.id = flashcard_decks.topic_id
    and topics.user_id = auth.uid()
  ));

-- Create NEW policies for flashcards (referencing decks)
create policy "Users can view their own deck flashcards"
  on flashcards for select
  using (exists (
    select 1 from flashcard_decks
    join topics on topics.id = flashcard_decks.topic_id
    where flashcard_decks.id = flashcards.deck_id
    and topics.user_id = auth.uid()
  ));

create policy "Users can insert flashcards to their own decks"
  on flashcards for insert
  with check (exists (
    select 1 from flashcard_decks
    join topics on topics.id = flashcard_decks.topic_id
    where flashcard_decks.id = flashcards.deck_id
    and topics.user_id = auth.uid()
  ));

create policy "Users can update their own deck flashcards"
  on flashcards for update
  using (exists (
    select 1 from flashcard_decks
    join topics on topics.id = flashcard_decks.topic_id
    where flashcard_decks.id = flashcards.deck_id
    and topics.user_id = auth.uid()
  ));

create policy "Users can delete their own deck flashcards"
  on flashcards for delete
  using (exists (
    select 1 from flashcard_decks
    join topics on topics.id = flashcard_decks.topic_id
    where flashcard_decks.id = flashcards.deck_id
    and topics.user_id = auth.uid()
  ));
