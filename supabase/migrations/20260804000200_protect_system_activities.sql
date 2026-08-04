create or replace function public.prevent_system_activity_archive()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.system_key is not null and new.archived_at is not null then
    raise exception 'System activities cannot be archived'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger activity_types_prevent_system_archive
before update of archived_at on public.activity_types
for each row execute function public.prevent_system_activity_archive();
