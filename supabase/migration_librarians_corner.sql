-- ============================================================
-- Migration: Librarian's Corner + Tip Jar
-- Run this once in Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- Safe to run on a database that already has schema.sql applied.
-- ============================================================

-- Blog-style posts from the admins (Vivek & Lasya) about what they're
-- reading, thinking, or excited about next.
create table librarian_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  title text,
  body text not null,
  created_at timestamptz not null default now()
);

alter table librarian_posts enable row level security;

create policy "librarian posts are readable by any logged-in friend"
  on librarian_posts for select using (auth.role() = 'authenticated');
create policy "only admins write librarian posts"
  on librarian_posts for insert with check (is_admin() and auth.uid() = author_id);
create policy "only admins edit their own librarian posts"
  on librarian_posts for update using (is_admin() and auth.uid() = author_id)
  with check (is_admin() and auth.uid() = author_id);
create policy "only admins delete their own librarian posts"
  on librarian_posts for delete using (is_admin() and auth.uid() = author_id);

-- "Currently reading" / "want to read next" shown on each librarian's card.
alter table profiles add column currently_reading_book_id uuid references books (id);
alter table profiles add column want_to_read_book_id uuid references books (id);

-- Narrow RPC: only admins, and only their own row, and only these two columns.
create function update_my_reading_status(currently_reading uuid, want_to_read uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only librarians can set a reading status';
  end if;

  update profiles
  set currently_reading_book_id = currently_reading,
      want_to_read_book_id = want_to_read
  where id = auth.uid();
end;
$$;

grant execute on function update_my_reading_status(uuid, uuid) to authenticated;

-- An honor-system log of book-fund tips. There's no way for a website to
-- verify a real Venmo payment happened, so this simply records what
-- someone says they sent after actually paying via the Venmo link.
create table tips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

alter table tips enable row level security;

create policy "tips are readable by any logged-in friend"
  on tips for select using (auth.role() = 'authenticated');
create policy "friends log their own tip"
  on tips for insert with check (auth.uid() = user_id);
