create policy "Users can delete their own quiz progress"
  on user_quiz_progress for delete
  using (auth.uid() = user_id);

