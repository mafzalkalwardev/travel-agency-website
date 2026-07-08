-- Customer accounts and user-owned bookings

create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  nationality text,
  passport_number text,
  date_of_birth date,
  preferred_airport text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings add column if not exists customer_user_id uuid references auth.users(id) on delete set null;
alter table public.bookings add column if not exists product_title text;

create index if not exists idx_bookings_customer_user on public.bookings(customer_user_id, created_at desc);
create index if not exists idx_customer_profiles_email on public.customer_profiles(email);

alter table public.customer_profiles enable row level security;

drop policy if exists "Public insert bookings" on public.bookings;

create policy "Customer own profile select" on public.customer_profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "Customer own profile insert" on public.customer_profiles
  for insert with check (id = auth.uid());

create policy "Customer own profile update" on public.customer_profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Admin all customer_profiles" on public.customer_profiles
  for all using (public.is_admin());

create policy "Customer read own bookings" on public.bookings
  for select using (customer_user_id = auth.uid() or public.is_admin());

create policy "Customer insert own bookings" on public.bookings
  for insert with check (customer_user_id = auth.uid());

