# Supabase setup

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → **SQL** → **New query**.
2. Paste and run the contents of `migrations/001_canvases.sql`.
3. In **Storage**, confirm the `canvas-files` bucket exists (the migration creates it as public).

After that, **New File** on `/home` creates a saved project and **My Files** lists your canvases.
