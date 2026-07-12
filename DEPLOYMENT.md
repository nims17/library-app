# Deploying the Library — step by step

Everything below uses free tiers. No credit card required anywhere.

## 1. Create your three accounts

- **GitHub** — https://github.com/signup
- **Supabase** — https://supabase.com/dashboard/sign-up
- **Vercel** — https://vercel.com/signup (easiest: "Continue with GitHub" so it's linked automatically)

## 2. Push this code to GitHub

1. On GitHub, click **New repository** (e.g. `library-app`), keep it **Private**, don't add a README (we already have one).
2. In this project folder on your computer, run:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/library-app.git
   git push -u origin main
   ```

## 3. Set up Supabase

1. In the Supabase dashboard, click **New project**. Pick any name/region, set a database password (save it somewhere), and wait ~2 minutes for it to provision.
2. Go to **SQL Editor > New query**, paste the entire contents of `supabase/schema.sql` from this project, and click **Run**. This creates all 7 tables and the security rules.
3. Leave (or turn back on) public signup: **Authentication > Sign In / Providers**, make sure **Allow new users to sign up** is on. Friends create their own account at the `/signup` page in the app — Vivek just shares that link with people he trusts; it's not linked from anywhere public, so nobody stumbles onto it.
4. Vivek and Lasya should also just use `/signup` like everyone else, entering their name themselves. Once they've done that, make them admins. Go to **SQL Editor** and run (swap in their real emails):
   ```sql
   update profiles set role = 'admin'
   where id in (
     select id from auth.users
     where email in ('vivek@example.com', 'lasya@example.com')
   );
   ```
5. Grab your keys: **Project Settings > API** — copy the **Project URL** and the **anon public** key.

## 4. Set up Vercel

1. In Vercel, click **Add New > Project**, import the `library-app` GitHub repo.
2. Before deploying, expand **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = the Project URL from step 3.5
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon public key from step 3.5
3. Click **Deploy**. In about a minute you'll get a live URL like `library-app-yourname.vercel.app`.
4. Vivek sends `library-app-yourname.vercel.app/signup` directly to whichever friends he wants in the library. Each person creates their own account there — no dashboard work needed on your end.

## 5. Everyday workflow going forward

- To add features or fix something: edit the code, `git add . && git commit -m "..." && git push`. Vercel redeploys automatically within a minute.
- To add a new friend: Vivek just sends them the `/signup` link — nothing to do in Supabase.
- To add a book: log in as an admin and use the **Add a book** form on the `/admin` page — no code required.

## Costs, for real

- Vercel Hobby: free forever for personal projects like this.
- Supabase Free: free up to 500MB database and 50,000 monthly active users — nowhere close to what a friend group will use.
- GitHub: free for private repos.

Total ongoing cost: **$0**, unless you later want a custom domain (optional, ~$12/year).
