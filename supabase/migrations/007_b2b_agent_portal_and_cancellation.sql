-- Phase 3: B2B sub-agent credit model, ticket cancellation state, booking
-- status history, and TravelLine order/status cross-reference.
-- See docs/REDESIGN.md §3.6-3.8, §6, §8 for the research/design behind this.

-- 1. Tickets: cancelled state + image column ---------------------------

alter table public.tickets drop constraint if exists tickets_status_check;
alter table public.tickets add constraint tickets_status_check
  check (status in ('available', 'limited', 'sold_out', 'booked', 'cancelled'));

alter table public.tickets add column if not exists image_url text;
alter table public.tickets add column if not exists cancelled_at timestamptz;

-- 2. Bookings: TravelLine cross-reference fields ------------------------
-- travelline_booking_ref already stores the airline PNR; these add the
-- separate human-facing order id and TravelLine's own status/confirm time
-- so admin can cross-check "is this really confirmed on TravelLine" per
-- docs/REDESIGN.md §8.2 step 5, without tabbing over to their site.

alter table public.bookings add column if not exists travelline_order_id text;
alter table public.bookings add column if not exists travelline_status text
  check (travelline_status is null or travelline_status in ('RESERVED', 'CONFIRMED', 'CANCELLED'));
alter table public.bookings add column if not exists travelline_confirmed_at timestamptz;
alter table public.bookings add column if not exists travelline_status_checked_at timestamptz;

create index if not exists idx_bookings_travelline_order_id
  on public.bookings (travelline_order_id) where travelline_order_id is not null;

-- 3. Booking status history (audit trail) --------------------------------
-- Mirrors the shape TravelLine's own booking history uses (eventType +
-- previousData + timestamp) per docs/REDESIGN.md §3.7.

create table if not exists public.booking_status_history (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  previous_status text,
  new_status text not null,
  previous_data jsonb not null default '{}',
  changed_by uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_booking_status_history_booking
  on public.booking_status_history (booking_id, created_at desc);

create or replace function public.log_booking_status_change()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_status_history (booking_id, previous_status, new_status, previous_data, changed_by)
    values (new.id, null, new.status, '{}'::jsonb, auth.uid());
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.booking_status_history (booking_id, previous_status, new_status, previous_data, changed_by)
    values (
      new.id,
      old.status,
      new.status,
      jsonb_build_object(
        'status', old.status,
        'travelline_status', old.travelline_status,
        'supplier_hold_status', old.supplier_hold_status,
        'admin_notes', old.admin_notes
      ),
      auth.uid()
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists log_booking_status_change on public.bookings;
create trigger log_booking_status_change
after insert or update on public.bookings
for each row execute function public.log_booking_status_change();

-- 4. Sub-agent role + credit account model -------------------------------
-- docs/REDESIGN.md §8.3-8.4: sub-agents get a role distinct from retail
-- customers, and a TravelLine-style credit limit/balance instead of
-- per-booking payment proof.

alter table public.customer_profiles add column if not exists role text not null default 'customer'
  check (role in ('customer', 'agent'));
alter table public.customer_profiles add column if not exists credit_limit numeric not null default 0;
alter table public.customer_profiles add column if not exists credit_balance numeric not null default 0;

create index if not exists idx_customer_profiles_role on public.customer_profiles(role);

create table if not exists public.credit_transactions (
  id uuid primary key default uuid_generate_v4(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  type text not null check (type in ('debit', 'credit', 'refund', 'adjustment')),
  amount numeric not null check (amount > 0),
  balance_after numeric not null,
  booking_id uuid references public.bookings(id) on delete set null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_transactions_agent
  on public.credit_transactions (customer_profile_id, created_at desc);

-- 5. RLS for new tables ---------------------------------------------------

alter table public.booking_status_history enable row level security;
alter table public.credit_transactions enable row level security;

create policy "Admin all booking_status_history" on public.booking_status_history
  for all using (public.is_admin());

create policy "Agent read own booking_status_history" on public.booking_status_history
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_status_history.booking_id
        and b.customer_user_id = auth.uid()
    )
  );

create policy "Admin all credit_transactions" on public.credit_transactions
  for all using (public.is_admin());

create policy "Agent read own credit_transactions" on public.credit_transactions
  for select using (customer_profile_id = auth.uid());

-- 6. Prevent non-admins from editing their own role/credit fields ---------
-- Same pattern as prevent_customer_profile_approval_change (migration 006).

create or replace function public.prevent_customer_profile_credit_change()
returns trigger as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.credit_limit is distinct from old.credit_limit
     or new.credit_balance is distinct from old.credit_balance then
    raise exception 'Only admins can update agent role/credit fields';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists prevent_customer_profile_credit_change on public.customer_profiles;
create trigger prevent_customer_profile_credit_change
before update on public.customer_profiles
for each row execute function public.prevent_customer_profile_credit_change();
