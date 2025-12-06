-- Create a function to atomically increment flashcard counts
create or replace function increment_flashcard_counts(
  p_user_id uuid,
  p_flashcard_id uuid,
  p_status text,
  p_remembered_increment integer default 0,
  p_forgotten_increment integer default 0
)
returns void
language plpgsql
security definer
as $$
begin
  insert into user_flashcard_progress (
    user_id,
    flashcard_id,
    status,
    last_reviewed_at,
    remembered_count,
    forgotten_count
  )
  values (
    p_user_id,
    p_flashcard_id,
    p_status,
    now(),
    p_remembered_increment,
    p_forgotten_increment
  )
  on conflict (user_id, flashcard_id)
  do update set
    status = p_status,
    last_reviewed_at = now(),
    remembered_count = user_flashcard_progress.remembered_count + p_remembered_increment,
    forgotten_count = user_flashcard_progress.forgotten_count + p_forgotten_increment;
end;
$$;

