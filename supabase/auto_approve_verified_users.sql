
create or replace function public.approve_user_on_email_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.profiles
    set status = 'approved',
        approval_source = 'system',
        approved_at = now()
    where lower(email) = lower(new.email)
      and lower(coalesce(role, '')) in ('user', 'facility')
      and lower(coalesce(status, '')) = 'pending';
  end if;

  return new;
exception when others then
  -- Never block the email verification itself
  raise warning 'approve_user_on_email_verified failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists approve_user_on_email_verified on auth.users;
create trigger approve_user_on_email_verified
  after update of email_confirmed_at on auth.users
  for each row execute function public.approve_user_on_email_verified();

-- Users who already verified their email but are still waiting as "pending":
-- approve them now too. The result lists who was approved (may be empty).
update public.profiles p
set status = 'approved',
    approval_source = 'system',
    approved_at = now()
from auth.users u
where lower(u.email) = lower(p.email)
  and u.email_confirmed_at is not null
  and lower(coalesce(p.role, '')) in ('user', 'facility')
  and lower(coalesce(p.status, '')) = 'pending'
returning p.id, p.name, p.role, p.status;
