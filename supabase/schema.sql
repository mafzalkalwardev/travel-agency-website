-- Al Qibla Air Services — Supabase schema
-- Run in Supabase SQL Editor after creating project

-- Extensions
create extension if not exists "uuid-ossp";

-- Profiles (admin users linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Site settings (singleton row)
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'Al Qibla Air Services',
  tagline text,
  whatsapp_number text,
  email text,
  social_links jsonb default '{}',
  offices jsonb default '[]',
  updated_at timestamptz not null default now()
);

-- Announcements
create table if not exists public.announcements (
  id uuid primary key default uuid_generate_v4(),
  message text not null,
  priority int not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Flyers
create table if not exists public.flyers (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text not null default 'announcement',
  image_url text not null,
  link text,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Destinations
create table if not exists public.destinations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  country text not null,
  label text not null,
  slug text not null unique,
  image_url text,
  href text not null,
  available_count int default 0,
  starting_price numeric,
  currency text default 'PKR',
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Airlines
create table if not exists public.airlines (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  name text not null,
  logo_url text,
  regions text[] default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tickets
create table if not exists public.tickets (
  id uuid primary key default uuid_generate_v4(),
  airline text not null,
  airline_code text not null,
  flight_number text not null,
  from_code text not null,
  from_city text not null,
  to_code text not null,
  to_city text not null,
  sector text,
  destination text,
  departure_date date not null,
  departure_time text,
  arrival_time text,
  duration text,
  price numeric not null,
  currency text not null default 'PKR',
  seats_left int not null default 0,
  status text not null default 'available' check (status in ('available', 'limited', 'sold_out', 'booked')),
  baggage text,
  meal text,
  aircraft text,
  notes text,
  trip_type text default 'oneway',
  is_direct boolean default true,
  active boolean not null default true,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Umrah packages
create table if not exists public.umrah_packages (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  package_code text,
  category text,
  price numeric not null,
  currency text not null default 'PKR',
  duration text not null,
  departure_city text,
  airline text,
  hotel_makkah text,
  hotel_madinah text,
  distance_from_haram text,
  transport boolean default false,
  visa boolean default false,
  ziyarat boolean default false,
  seats_left int,
  highlights text[] default '{}',
  image_url text,
  featured boolean default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tour packages
create table if not exists public.tour_packages (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  destination text,
  price numeric,
  currency text default 'PKR',
  duration text not null,
  includes text[] default '{}',
  highlights text[] default '{}',
  image_url text,
  featured boolean default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Blog posts
create table if not exists public.blog_posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image_url text,
  category text,
  author text,
  published boolean not null default false,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reviews
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  city text,
  service text,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text not null,
  avatar_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  featured boolean not null default false,
  admin_notes text,
  consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);

-- Inquiries
create table if not exists public.inquiries (
  id uuid primary key default uuid_generate_v4(),
  type text not null default 'general',
  name text not null,
  email text,
  phone text,
  whatsapp text,
  service text,
  from_city text,
  to_city text,
  travel_date date,
  passengers int,
  budget numeric,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'in_progress', 'closed')),
  source_page text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Customer portal profiles
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

-- Gallery
create table if not exists public.gallery_items (
  id uuid primary key default uuid_generate_v4(),
  title text,
  image_url text not null,
  alt text,
  category text default 'all',
  display_order int default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Travel Line / external inventory linkage
alter table public.tickets add column if not exists external_id text;
alter table public.tickets add column if not exists source_provider text default 'manual';
alter table public.tickets add column if not exists raw_payload jsonb;

alter table public.umrah_packages add column if not exists external_id text;
alter table public.umrah_packages add column if not exists source_provider text default 'manual';
alter table public.umrah_packages add column if not exists raw_payload jsonb;

alter table public.tour_packages add column if not exists external_id text;
alter table public.tour_packages add column if not exists source_provider text default 'manual';
alter table public.tour_packages add column if not exists raw_payload jsonb;

create unique index if not exists idx_tickets_provider_external
  on public.tickets (source_provider, external_id)
  where external_id is not null;

create unique index if not exists idx_umrah_provider_external
  on public.umrah_packages (source_provider, external_id)
  where external_id is not null;

create unique index if not exists idx_tour_provider_external
  on public.tour_packages (source_provider, external_id)
  where external_id is not null;

-- Integration sessions (Travel Line auth cookies)
create table if not exists public.integration_sessions (
  id uuid primary key default uuid_generate_v4(),
  provider text not null default 'travelline',
  session_data jsonb not null default '{}',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_integration_sessions_provider
  on public.integration_sessions (provider);

-- Customer booking requests (hold-then-pay)
create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  status text not null default 'pending_payment' check (
    status in ('pending_payment', 'payment_confirmed', 'booking_in_progress', 'confirmed', 'failed', 'cancelled')
  ),
  product_type text not null check (product_type in ('ticket', 'umrah', 'tour')),
  ticket_id uuid references public.tickets(id) on delete set null,
  umrah_package_id uuid references public.umrah_packages(id) on delete set null,
  tour_package_id uuid references public.tour_packages(id) on delete set null,
  external_product_id text,
  customer_user_id uuid references auth.users(id) on delete set null,
  product_title text,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  passenger_details jsonb not null default '{}',
  passengers int not null default 1,
  quoted_price numeric not null,
  currency text not null default 'PKR',
  travelline_booking_ref text,
  travelline_response jsonb,
  admin_notes text,
  error_message text,
  source_page text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_status on public.bookings(status, created_at desc);
create index if not exists idx_bookings_phone_pending on public.bookings(customer_phone, status)
  where status = 'pending_payment';
create index if not exists idx_bookings_customer_user on public.bookings(customer_user_id, created_at desc);
create index if not exists idx_customer_profiles_email on public.customer_profiles(email);

-- Sync logs
create table if not exists public.sync_logs (
  id uuid primary key default uuid_generate_v4(),
  provider text not null,
  status text not null check (status in ('success', 'partial', 'failed')),
  tickets_processed int default 0,
  tickets_created int default 0,
  tickets_updated int default 0,
  tickets_deactivated int default 0,
  message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.sync_changes (
  id uuid primary key default uuid_generate_v4(),
  sync_log_id uuid references public.sync_logs(id) on delete cascade,
  provider text not null,
  entity_type text not null check (entity_type in ('ticket', 'umrah_package', 'tour_package', 'promo')),
  entity_id uuid,
  external_id text,
  change_type text not null check (change_type in ('created', 'updated', 'deactivated')),
  field_changes jsonb not null default '{}',
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_tickets_active on public.tickets(active, departure_date);
create index if not exists idx_reviews_status on public.reviews(status);
create index if not exists idx_inquiries_status on public.inquiries(status);
create index if not exists idx_blog_published on public.blog_posts(published, published_at desc);
create index if not exists idx_sync_changes_log on public.sync_changes(sync_log_id, created_at desc);
create index if not exists idx_sync_changes_entity on public.sync_changes(entity_type, external_id, created_at desc);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- RLS
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.announcements enable row level security;
alter table public.flyers enable row level security;
alter table public.destinations enable row level security;
alter table public.airlines enable row level security;
alter table public.tickets enable row level security;
alter table public.umrah_packages enable row level security;
alter table public.tour_packages enable row level security;
alter table public.blog_posts enable row level security;
alter table public.reviews enable row level security;
alter table public.inquiries enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.gallery_items enable row level security;
alter table public.sync_logs enable row level security;
alter table public.sync_changes enable row level security;
alter table public.integration_sessions enable row level security;
alter table public.bookings enable row level security;

-- Helper: is admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$$ language sql security definer stable;

-- Public read policies (active/published/approved only)
create policy "Public read active announcements" on public.announcements for select using (active = true);
create policy "Public read active flyers" on public.flyers for select using (active = true);
create policy "Public read active destinations" on public.destinations for select using (active = true);
create policy "Public read active airlines" on public.airlines for select using (active = true);
create policy "Public read active tickets" on public.tickets for select using (active = true and status != 'sold_out');
create policy "Public read active umrah" on public.umrah_packages for select using (status = 'active');
create policy "Public read active tours" on public.tour_packages for select using (status = 'active');
create policy "Public read published blog" on public.blog_posts for select using (published = true);
create policy "Public read approved reviews" on public.reviews for select using (status = 'approved');
create policy "Public read active gallery" on public.gallery_items for select using (active = true);
create policy "Public read site settings" on public.site_settings for select using (true);

-- Public insert
create policy "Public insert reviews pending" on public.reviews for insert with check (status = 'pending' and consent = true);
create policy "Public insert inquiries" on public.inquiries for insert with check (true);
create policy "Customer insert own bookings" on public.bookings for insert with check (customer_user_id = auth.uid());
create policy "Customer read own bookings" on public.bookings for select using (customer_user_id = auth.uid() or public.is_admin());

-- Customer account access
create policy "Customer own profile select" on public.customer_profiles for select using (id = auth.uid() or public.is_admin());
create policy "Customer own profile insert" on public.customer_profiles for insert with check (id = auth.uid());
create policy "Customer own profile update" on public.customer_profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Admin full access
create policy "Admin all announcements" on public.announcements for all using (public.is_admin());
create policy "Admin all flyers" on public.flyers for all using (public.is_admin());
create policy "Admin all destinations" on public.destinations for all using (public.is_admin());
create policy "Admin all airlines" on public.airlines for all using (public.is_admin());
create policy "Admin all tickets" on public.tickets for all using (public.is_admin());
create policy "Admin all umrah" on public.umrah_packages for all using (public.is_admin());
create policy "Admin all tours" on public.tour_packages for all using (public.is_admin());
create policy "Admin all blog" on public.blog_posts for all using (public.is_admin());
create policy "Admin all reviews" on public.reviews for all using (public.is_admin());
create policy "Admin all inquiries" on public.inquiries for all using (public.is_admin());
create policy "Admin all customer_profiles" on public.customer_profiles for all using (public.is_admin());
create policy "Admin all gallery" on public.gallery_items for all using (public.is_admin());
create policy "Admin all sync_logs" on public.sync_logs for all using (public.is_admin());
create policy "Admin all sync_changes" on public.sync_changes for all using (public.is_admin());
create policy "Admin all integration_sessions" on public.integration_sessions for all using (public.is_admin());
create policy "Admin all bookings" on public.bookings for all using (public.is_admin());
create policy "Admin site settings" on public.site_settings for all using (public.is_admin());
create policy "Admin own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());

-- Storage buckets (run in dashboard or via API):
-- flyers, gallery, packages, blog, airlines, heroes, reviews
