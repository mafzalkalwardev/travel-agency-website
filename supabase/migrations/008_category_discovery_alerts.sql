-- Phase 3: category auto-detection via TravelLine's GET /api/categories.
-- See docs/REDESIGN.md §3.6/§6. A category present in TravelLine's live
-- response but not yet in TRAVELLINE_GROUP_CATEGORIES gets logged here for
-- admin review instead of silently auto-adding it to production.

create table if not exists public.category_alerts (
  id uuid primary key default uuid_generate_v4(),
  category_name text not null unique,
  image_url text,
  available_groups_count int,
  status text not null default 'pending' check (status in ('pending', 'approved', 'dismissed')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);

alter table public.category_alerts enable row level security;

create policy "Admin all category_alerts" on public.category_alerts
  for all using (public.is_admin());
