-- Add count columns to track statistics
alter table user_flashcard_progress 
  add column if not exists remembered_count integer default 0,
  add column if not exists forgotten_count integer default 0;

-- Update existing rows to have counts based on current status
update user_flashcard_progress
set remembered_count = case when status = 'remembered' then 1 else 0 end,
    forgotten_count = case when status = 'forgotten' then 1 else 0 end
where remembered_count = 0 and forgotten_count = 0;

