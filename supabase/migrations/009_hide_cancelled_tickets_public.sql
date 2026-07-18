-- Phase 3: a ticket can now be status='cancelled' (migration 007) while
-- still active=true (e.g. an admin cancels it without deactivating the
-- row, to preserve it in history). Public listings should not show it.

drop policy if exists "Public read active tickets" on public.tickets;
create policy "Public read active tickets" on public.tickets
  for select using (active = true and status not in ('sold_out', 'cancelled'));
