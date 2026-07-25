-- Tours: admin-managed posts/cards for the public /tours/ page.
-- Separate from tour_packages (priced booking packages) and blog_posts.

create table if not exists public.tours (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  excerpt text,
  description text,
  location text,
  duration text,
  price numeric,
  currency text default 'PKR',
  image_url text,
  featured boolean default false,
  display_order int not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tours enable row level security;

drop policy if exists "Public read active tour posts" on public.tours;
create policy "Public read active tour posts" on public.tours
  for select using (status = 'active');

drop policy if exists "Admin all tour posts" on public.tours;
create policy "Admin all tour posts" on public.tours
  for all using (public.is_admin());
