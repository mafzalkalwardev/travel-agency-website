-- Fix: admin API routes correctly use the service-role client
-- (createAdminClient()) after already checking requireAdmin() at the
-- application layer — but is_admin() only checked auth.uid(), which is
-- NULL for service-role Postgres connections (no JWT user context).
-- RLS policies using is_admin() were unaffected (service_role bypasses
-- RLS entirely by Postgres/Supabase design), but the two BEFORE UPDATE
-- triggers that call is_admin() imperatively (prevent_customer_profile_
-- approval_change from migration 006, prevent_customer_profile_credit_
-- change from migration 007) are NOT bypassed by service_role, so every
-- admin-panel customer approval/reject was being rejected with "Only
-- admins can update customer approval fields" — reported live 2026-07-20.

create or replace function public.is_admin()
returns boolean as $$
  select
    coalesce(auth.role(), '') = 'service_role'
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'editor')
    );
$$ language sql security definer stable;
