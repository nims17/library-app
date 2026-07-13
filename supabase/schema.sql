-- ============================================================
-- Vivek & Lasya's Library — Supabase schema
-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================

-- 1. PROFILES ------------------------------------------------
-- One row per person. Extends Supabase's built-in auth.users.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  member_since timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created.
-- display_name is left blank here on purpose — the app prompts each
-- person to enter their real name the first time they log in (see the
-- /onboarding page), rather than relying on the admin to type it in
-- correctly when creating the account.
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Lets a logged-in person set only their own display name — nothing else.
-- Runs as "security definer" (bypasses RLS internally) but is deliberately
-- narrow: it can never touch role or anyone else's row, so there's no way
-- for a friend to use this to make themselves an admin.
create function update_my_display_name(new_display_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
  set display_name = new_display_name
  where id = auth.uid();
end;
$$;

grant execute on function update_my_display_name(text) to authenticated;

-- 2. BOOKS -----------------------------------------------------
create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  description text,
  cover_url text,
  genre text,
  dewey_decimal text,
  status text not null default 'available' check (status in ('available', 'checked_out')),
  created_at timestamptz not null default now(),
  -- Set by a librarian to feature this book on the Browse page (up to 3 at
  -- once). Null = not featured. Doubles as the sort order (oldest first).
  featured_at timestamptz
);

-- 3. CHECKOUT REQUESTS ------------------------------------------
-- Created when a friend clicks "Check Out." An admin approves or denies it.
create table checkout_requests (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books (id) on delete cascade,
  requested_by uuid not null references profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references profiles (id)
);

-- 4. LOANS -------------------------------------------------------
-- The actual record of who has/had a book. Created either when an admin
-- approves a checkout_request, or when an admin logs a manual checkout.
create table loans (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  checked_out_at timestamptz not null default now(),
  returned_at timestamptz,
  recorded_by uuid references profiles (id)
);

-- 5. WAITLIST ------------------------------------------------------
-- If a book is already checked out, friends can "write their name down."
-- Position in line = count of rows for that book with an earlier requested_at.
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  requested_at timestamptz not null default now(),
  unique (book_id, user_id)
);

-- 6. NEW BOOK REQUESTS -----------------------------------------------
create table new_book_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references profiles (id) on delete cascade,
  title text not null,
  author text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'added', 'declined')),
  created_at timestamptz not null default now()
);

-- 7. REVIEWS -------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  rating int check (rating between 1 and 5),
  thoughts text,
  created_at timestamptz not null default now(),
  unique (book_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Everything is readable by any logged-in friend (small trusted group,
-- part of the fun is seeing what everyone's reading). Writes are locked
-- down: people can only create things "as themselves," and anything
-- that changes catalog state or approves/denies requests is admin-only.
-- ============================================================

alter table profiles enable row level security;
alter table books enable row level security;
alter table checkout_requests enable row level security;
alter table loans enable row level security;
alter table waitlist enable row level security;
alter table new_book_requests enable row level security;
alter table reviews enable row level security;

-- Helper: is the current logged-in user an admin?
create function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- profiles
create policy "profiles are readable by any logged-in friend"
  on profiles for select using (auth.role() = 'authenticated');

-- books
create policy "books are readable by any logged-in friend"
  on books for select using (auth.role() = 'authenticated');
create policy "only admins manage books"
  on books for all using (is_admin()) with check (is_admin());

-- checkout_requests
create policy "checkout requests are readable by any logged-in friend"
  on checkout_requests for select using (auth.role() = 'authenticated');
create policy "friends create their own checkout request"
  on checkout_requests for insert with check (auth.uid() = requested_by);
create policy "only admins decide checkout requests"
  on checkout_requests for update using (is_admin()) with check (is_admin());

-- loans
create policy "loans are readable by any logged-in friend"
  on loans for select using (auth.role() = 'authenticated');
create policy "only admins create loans"
  on loans for insert with check (is_admin());
create policy "only admins update loans"
  on loans for update using (is_admin()) with check (is_admin());

-- waitlist
create policy "waitlist is readable by any logged-in friend"
  on waitlist for select using (auth.role() = 'authenticated');
create policy "friends join the waitlist as themselves"
  on waitlist for insert with check (auth.uid() = user_id);
create policy "friends or admins can remove a waitlist entry"
  on waitlist for delete using (auth.uid() = user_id or is_admin());

-- new_book_requests
create policy "requests are readable by any logged-in friend"
  on new_book_requests for select using (auth.role() = 'authenticated');
create policy "friends submit their own new book request"
  on new_book_requests for insert with check (auth.uid() = requested_by);
create policy "only admins update request status"
  on new_book_requests for update using (is_admin()) with check (is_admin());

-- reviews
create policy "reviews are readable by any logged-in friend"
  on reviews for select using (auth.role() = 'authenticated');
create policy "friends write their own reviews"
  on reviews for insert with check (auth.uid() = user_id);
create policy "friends edit their own reviews"
  on reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "friends delete their own reviews"
  on reviews for delete using (auth.uid() = user_id);

-- 8. LIBRARIAN'S CORNER ------------------------------------------------
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

-- 9. TIP JAR -------------------------------------------------------------
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
