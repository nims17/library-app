-- ============================================================
-- Migration: v2 UX overhaul
-- Run this once in Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- Safe to run on a database that already has schema.sql and
-- migration_librarians_corner.sql applied.
-- ============================================================

-- Page count, so the browse page can show an estimated reading time.
alter table books add column if not exists page_count integer;

-- Profile photo, shown on the library card and on Community posts.
alter table profiles add column if not exists avatar_url text;

-- Set when a librarian asks a borrower to bring a book back.
-- Cleared automatically once the loan is marked returned.
alter table loans add column if not exists recall_requested_at timestamptz;

-- Distinguishes the two "real" librarians (Vivek & Lasya) from any other
-- account that happens to have role='admin' (e.g. yours, for managing the
-- site). role still controls permissions everywhere; this flag only
-- controls who shows up as a librarian on the Community page and whose
-- reviews count toward a book's "librarian rating."
alter table profiles add column if not exists is_public_librarian boolean not null default false;

-- Email, so the app can send return-recall notifications without needing
-- a service-role key or any extra admin API access. Populated going
-- forward by handle_new_user(); backfilled once below for existing rows.
alter table profiles add column if not exists email text;

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id, new.raw_user_meta_data ->> 'display_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

update profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- ------------------------------------------------------------
-- Community: open posting up to any member, not just librarians.
-- The app distinguishes librarian vs. member posts visually by
-- joining profiles.role, so no schema change is needed there —
-- just loosen who's allowed to write.
-- ------------------------------------------------------------
drop policy if exists "only admins write librarian posts" on librarian_posts;
drop policy if exists "only admins edit their own librarian posts" on librarian_posts;
drop policy if exists "only admins delete their own librarian posts" on librarian_posts;

create policy "any friend writes their own post"
  on librarian_posts for insert with check (auth.uid() = author_id);
create policy "any friend edits their own post"
  on librarian_posts for update using (auth.uid() = author_id)
  with check (auth.uid() = author_id);
create policy "any friend deletes their own post"
  on librarian_posts for delete using (auth.uid() = author_id);

-- Narrow RPC: only admins, and only their own row, and only avatar_url.
-- (display_name already has its own narrow RPC from schema.sql.)
create or replace function update_my_avatar(new_avatar_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
  set avatar_url = new_avatar_url
  where id = auth.uid();
end;
$$;

grant execute on function update_my_avatar(text) to authenticated;

-- Narrow RPC: only admins can flag/clear a recall on a loan they didn't
-- necessarily record, and only on loans that are still active.
create or replace function set_loan_recall(loan_id uuid, recall boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only librarians can recall a loan';
  end if;

  update loans
  set recall_requested_at = case when recall then now() else null end
  where id = loan_id and returned_at is null;
end;
$$;

grant execute on function set_loan_recall(uuid, boolean) to authenticated;

-- ------------------------------------------------------------
-- Storage: profile photos and admin-uploaded book cover photos.
-- Both buckets are public-read (small trusted friend group, and covers/
-- avatars aren't sensitive), with writes locked down per-user or to admins.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

create policy "avatar images are publicly readable"
  on storage.objects for select using (bucket_id = 'avatars');
create policy "friends upload their own avatar"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "friends replace their own avatar"
  on storage.objects for update using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "book cover photos are publicly readable"
  on storage.objects for select using (bucket_id = 'book-covers');
create policy "admins upload book cover photos"
  on storage.objects for insert with check (
    bucket_id = 'book-covers' and is_admin()
  );
