-- Phase 4: prevent overlapping sync runs once the external 1-minute
-- scheduler is live. A full sync currently takes ~110s (see
-- docs/REDESIGN.md §7 risk note), uncomfortably close to the 60s gap
-- between scheduled runs — without a lock, a slow run could still be in
-- flight when the next one starts.

create table if not exists public.sync_locks (
  provider text primary key,
  locked_at timestamptz not null default now()
);

alter table public.sync_locks enable row level security;

create policy "Admin all sync_locks" on public.sync_locks
  for all using (public.is_admin());
