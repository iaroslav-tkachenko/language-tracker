-- Backfill application-owned rows when the migration is applied to a project
-- that already contains authentication users.
insert into public.profiles (user_id)
select id
from auth.users
on conflict (user_id) do nothing;

insert into public.activity_types (user_id, name, system_key, position)
select
  users.id,
  activities.name,
  activities.system_key,
  activities.position
from auth.users as users
cross join (
  values
    ('Reading', 'reading', 0),
    ('Podcast', 'podcast', 1),
    ('Speaking', 'speaking', 2),
    ('Writing', 'writing', 3),
    ('Anki', 'anki', 4),
    ('Grammar', 'grammar', 5),
    ('TV Show / Film', 'tv_show_film', 6)
) as activities(name, system_key, position)
on conflict do nothing;

-- Creation/restoration must not be bypassed by direct table inserts. These
-- functions derive ownership from auth.uid(), serialize limit checks, and use
-- a fixed search path, so they can safely own the required table privileges.
alter function public.create_or_restore_language_board(text) security definer;
alter function public.create_or_restore_activity_type(text) security definer;

create or replace function public.assert_study_entry_resources_active()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.language_boards
    where id = new.board_id
      and user_id = new.user_id
      and archived_at is null
  ) then
    raise exception 'Study entries require an active owned language board'
      using errcode = 'check_violation';
  end if;

  if not exists (
    select 1
    from public.activity_types
    where id = new.activity_type_id
      and user_id = new.user_id
      and archived_at is null
  ) then
    raise exception 'Study entries require an active owned activity type'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger study_entries_require_active_resources
before insert or update of user_id, board_id, activity_type_id
on public.study_entries
for each row execute function public.assert_study_entry_resources_active();

-- Users create boards and activities only through the restoration-aware RPCs.
-- Column grants keep stable system activity identities immutable while still
-- allowing the owner to rename, reorder, archive, and delete eligible rows.
revoke insert on table public.language_boards from authenticated;
revoke insert on table public.activity_types from authenticated;
revoke update on table public.profiles from authenticated;
revoke update on table public.language_boards from authenticated;
revoke update on table public.activity_types from authenticated;

grant update (name, position, archived_at)
on table public.language_boards to authenticated;

grant update (name, position, archived_at)
on table public.activity_types to authenticated;

revoke all on function public.assert_study_entry_resources_active()
from public, anon, authenticated;
