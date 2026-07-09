-- Customer approval workflow

alter table public.customer_profiles
  add column if not exists approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approval_notes text;

create index if not exists idx_customer_profiles_approval_status
  on public.customer_profiles(approval_status, created_at desc);

create or replace function public.prevent_customer_profile_approval_change()
returns trigger as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.approval_status is distinct from old.approval_status
     or new.approved_at is distinct from old.approved_at
     or new.approved_by is distinct from old.approved_by
     or new.approval_notes is distinct from old.approval_notes then
    raise exception 'Only admins can update customer approval fields';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists prevent_customer_profile_approval_change on public.customer_profiles;
create trigger prevent_customer_profile_approval_change
before update on public.customer_profiles
for each row execute function public.prevent_customer_profile_approval_change();
