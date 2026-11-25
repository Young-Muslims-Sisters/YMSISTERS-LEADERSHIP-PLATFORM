-- IT can permanently remove a person: their profile, roles and every submission.
-- The audit log keeps who did it and when, but none of the person's details.
create function public.delete_person(person_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  person_email text;
  submission_count integer;
begin
  if not private.is_it_admin() then
    raise exception 'IT access required' using errcode = '42501';
  end if;

  -- The lock makes a submission for this person wait until the delete is finished.
  select lower(u.email) into person_email from public.users u where u.id = person_id for update;
  if not found then
    raise exception 'Person not found' using errcode = 'P0002';
  end if;

  update public.audit_log set actor_user_id = null where actor_user_id = person_id;
  update public.annual_submissions set possible_duplicate_user_id = null
    where possible_duplicate_user_id = person_id;
  delete from public.notification_deliveries d using public.annual_submissions s
    where d.submission_id = s.id and s.user_id = person_id;
  delete from public.role_assignments where user_id = person_id;
  delete from public.annual_submissions where user_id = person_id;
  get diagnostics submission_count = row_count;
  delete from public.identity_mismatches where email = person_email;
  delete from public.users where id = person_id;

  insert into public.audit_log (action, entity, entity_id, details)
  values ('delete_person', 'users', person_id, jsonb_build_object(
    'actor_auth_id', (select auth.uid()), 'submissions_deleted', submission_count));
end;
$$;
revoke all on function public.delete_person(uuid) from public, anon;
grant execute on function public.delete_person(uuid) to authenticated;
