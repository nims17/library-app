-- Lets a librarian hand-pick up to 3 books to feature on the Browse page,
-- instead of that list being auto-computed from ratings.
-- featured_at doubles as both the on/off flag (null = not featured) and the
-- sort order (oldest featured_at first = order they were picked in).
alter table books add column featured_at timestamptz;
