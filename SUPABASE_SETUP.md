# Supabase Setup — Al Qibla Air Services

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Copy the **Project URL** and **anon public key** from Settings → API.
3. Copy the **service role key** (server only — never expose to the browser).

## 2. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_PASSWORD=your-database-password
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=923315576169
CRON_SECRET=your-random-cron-secret
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=use-a-strong-password
```

## 3. Run database schema

In Supabase SQL Editor, run:

1. `supabase/schema.sql` — tables, indexes, RLS policies
2. `supabase/seed.sql` — optional development seed data

If you add `SUPABASE_DB_PASSWORD` from Supabase Dashboard > Settings > Database, you can apply the schema locally:

```bash
node scripts/apply-schema.js
npm run check-db
```

## 4. Storage buckets

Create these buckets in Supabase Storage:

| Bucket     | Public read |
|------------|-------------|
| flyers     | yes         |
| gallery    | yes         |
| packages   | yes         |
| blog       | yes         |
| airlines   | yes         |
| heroes     | yes         |
| reviews    | no          |

## 5. Create admin user

1. Supabase Dashboard → Authentication → Users → Add user (email + password).
2. After signup, insert profile row:

```sql
insert into public.profiles (id, email, full_name, role)
select id, email, 'Admin', 'admin'
from auth.users
where email = 'your-admin@email.com';
```

## 6. Row Level Security

RLS is defined in `schema.sql`:

- **Public** can read active/published/approved content only.
- **Public** can insert inquiries and pending reviews (with consent).
- **Admin** (profiles.role = admin) has full CRUD via `is_admin()` helper.

## 7. Cron ticket sync

Configure Vercel Cron to call:

```
GET /api/cron/sync-tickets/
Authorization: Bearer YOUR_CRON_SECRET
```

This logs results to `sync_logs` and uses approved providers only (no scraping).

## 9. Production Auth (live site)

Project: `gjatvtyzncpusgkpzldz` · Site: `https://flywithalqibla.com`

### Auth URLs

Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://flywithalqibla.com`
- **Redirect URLs:**
  - `https://flywithalqibla.com/**`
  - `https://flywithalqibla.com/account/**`
  - `http://localhost:3000/**` (local only)

### Custom SMTP (Resend)

Dashboard → Authentication → SMTP:

| Field | Value |
|-------|--------|
| Enable custom SMTP | ON |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your `RESEND_API_KEY` |
| Sender email | `noreply@flywithalqibla.com` |
| Sender name | `Al Qibla Air Services` |

Or apply via Management API (needs [access token](https://supabase.com/dashboard/account/tokens)):

```bash
# Add to .env: SUPABASE_ACCESS_TOKEN=sbp_...
node scripts/configure-supabase-auth-live.js
```

After enabling Custom SMTP, raise the Auth email rate limit (default 30/hour) under Authentication → Rate Limits if needed.
