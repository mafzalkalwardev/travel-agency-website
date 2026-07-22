-- B2B agent portal: capture full company details at signup (Travel Line parity).
-- Travel Line sub-agent signup collects Company Name + Address alongside contact fields.

alter table public.customer_profiles
  add column if not exists company_name text;

alter table public.customer_profiles
  add column if not exists city text;

create index if not exists idx_customer_profiles_company_name
  on public.customer_profiles (company_name)
  where company_name is not null;
