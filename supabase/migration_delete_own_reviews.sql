-- Lets a member delete their own review (needed for the "My Reviews" list
-- on the library card page). Reviews were previously only insertable and
-- editable by their author, not deletable.
create policy "friends delete their own reviews"
  on reviews for delete using (auth.uid() = user_id);
