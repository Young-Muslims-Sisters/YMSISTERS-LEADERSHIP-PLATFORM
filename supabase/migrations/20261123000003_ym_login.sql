-- Directory and IT access come from a verified Google Workspace sign-in on an
-- allowed YM domain. Every policy in 20261116000002 goes through these rules.
--
-- To change the domain:  insert into private.allowed_domains values ('new.org');
-- To add an IT admin:    insert into private.it_admins values ('name@ymsisters.com');

create table private.allowed_domains (
  domain text primary key check (domain = lower(domain))
);
create table private.it_admins (
  email text primary key check (email = lower(email))
);
insert into private.allowed_domains values ('ymsisters.com');
insert into private.it_admins values ('shura@ymsisters.com'), ('aleeza.bhatti@ymsisters.com');

-- 'it_admin', 'member' or 'none' for the signed-in person.
--   * The Google identity is checked, not the account email, so a password
--     account that merely claims a YM address gets nothing.
--   * `hd` is Google's proof that a Workspace manages the account.
--   * People sign in again every 7 days, so a suspended mailbox loses access.
create or replace function private.current_platform_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case when a.email is null then 'member' else 'it_admin' end
    from auth.identities i
    join private.allowed_domains d
      on d.domain = split_part(lower(i.identity_data ->> 'email'), '@', 2)
    join private.allowed_domains w
      on w.domain = lower(i.identity_data #>> '{custom_claims,hd}')
    left join private.it_admins a on a.email = lower(i.identity_data ->> 'email')
    where i.user_id = (select auth.uid())
      and i.provider = 'google'
      and (i.identity_data ->> 'email_verified')::boolean
      and (auth.jwt() #>> '{amr,0,timestamp}')::bigint > extract(epoch from now() - interval '7 days')
    order by a.email nulls last
    limit 1
  ), 'none');
$$;

-- Lets the app ask what the signed-in person may open.
create function public.my_access()
returns text
language sql
stable
set search_path = ''
as $$ select private.current_platform_role(); $$;
revoke all on function public.my_access() from public, anon;
grant execute on function public.my_access() to authenticated;

-- Replaced by the rules above.
alter table public.users drop column platform_role;
