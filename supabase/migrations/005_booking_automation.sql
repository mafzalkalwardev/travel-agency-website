-- Booking automation: supplier hold tracking + notification log

alter table public.bookings
  add column if not exists supplier_hold_status text
    check (supplier_hold_status is null or supplier_hold_status in ('held', 'failed', 'pending')),
  add column if not exists supplier_hold_error text,
  add column if not exists supplier_hold_attempts int not null default 0,
  add column if not exists notifications_sent_at timestamptz;

create index if not exists idx_bookings_supplier_hold_failed
  on public.bookings (created_at desc)
  where status = 'pending_payment' and supplier_hold_status = 'failed';

create table if not exists public.notification_log (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references public.bookings(id) on delete set null,
  channel text not null check (channel in ('email_customer', 'email_admin')),
  recipient text not null,
  template text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_log_booking on public.notification_log(booking_id, created_at desc);

alter table public.notification_log enable row level security;

create policy "Admin read notification_log" on public.notification_log
  for select using (public.is_admin());
