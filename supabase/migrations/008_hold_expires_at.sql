-- Hold expiry tracking for Travel Line RESERVED seats (~1 hour windows).
alter table public.bookings add column if not exists hold_expires_at timestamptz;

create index if not exists idx_bookings_hold_expires_at
  on public.bookings (hold_expires_at)
  where hold_expires_at is not null and status = 'pending_payment';
