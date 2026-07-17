create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);

create table public.language_boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  name text not null,
  position smallint not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint language_boards_name_valid check (
    name = btrim(name)
    and char_length(name) between 1 and 50
  ),
  constraint language_boards_position_valid check (position >= 0),
  constraint language_boards_id_user_id_key unique (id, user_id)
);

create unique index language_boards_active_name_key
  on public.language_boards (user_id, lower(name))
  where archived_at is null;

create table public.activity_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  name text not null,
  system_key text,
  position smallint not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint activity_types_name_valid check (
    name = btrim(name)
    and char_length(name) between 1 and 50
  ),
  constraint activity_types_position_valid check (position >= 0),
  constraint activity_types_system_key_valid check (
    system_key is null
    or system_key in (
      'reading',
      'podcast',
      'speaking',
      'writing',
      'anki',
      'grammar',
      'tv_show_film'
    )
  ),
  constraint activity_types_user_system_key_key unique (user_id, system_key),
  constraint activity_types_id_user_id_key unique (id, user_id)
);

create unique index activity_types_active_name_key
  on public.activity_types (user_id, lower(name))
  where archived_at is null;

create table public.study_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  board_id uuid not null,
  activity_type_id uuid not null,
  study_date date not null,
  duration_minutes smallint not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint study_entries_duration_valid check (
    duration_minutes between 1 and 1440
  ),
  constraint study_entries_board_owner_fkey foreign key (board_id, user_id)
    references public.language_boards (id, user_id) on delete restrict,
  constraint study_entries_activity_owner_fkey foreign key (
    activity_type_id,
    user_id
  ) references public.activity_types (id, user_id) on delete restrict
);

create index study_entries_board_date_idx
  on public.study_entries (user_id, board_id, study_date);

create index study_entries_activity_date_idx
  on public.study_entries (
    user_id,
    board_id,
    activity_type_id,
    study_date
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger language_boards_set_updated_at
before update on public.language_boards
for each row execute function public.set_updated_at();

create trigger activity_types_set_updated_at
before update on public.activity_types
for each row execute function public.set_updated_at();

create trigger study_entries_set_updated_at
before update on public.study_entries
for each row execute function public.set_updated_at();

create or replace function public.enforce_active_resource_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  active_count integer;
  active_limit integer;
begin
  if new.archived_at is not null then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.archived_at is null then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text || ':' || tg_table_name, 0)
  );

  if tg_table_name = 'language_boards' then
    active_limit := 6;
    select count(*) into active_count
    from public.language_boards
    where user_id = new.user_id and archived_at is null;
  elsif tg_table_name = 'activity_types' then
    active_limit := 30;
    select count(*) into active_count
    from public.activity_types
    where user_id = new.user_id and archived_at is null;
  else
    raise exception 'Unsupported active resource table';
  end if;

  if active_count >= active_limit then
    raise exception 'Active % limit of % reached', tg_table_name, active_limit
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger language_boards_enforce_active_limit
before insert or update of archived_at on public.language_boards
for each row execute function public.enforce_active_resource_limit();

create trigger activity_types_enforce_active_limit
before insert or update of archived_at on public.activity_types
for each row execute function public.enforce_active_resource_limit();

create or replace function public.create_or_restore_language_board(p_name text)
returns public.language_boards
language plpgsql
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_name text := btrim(p_name);
  existing_board public.language_boards;
  result public.language_boards;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = 'insufficient_privilege';
  end if;

  if normalized_name is null or char_length(normalized_name) not between 1 and 50 then
    raise exception 'Board name must contain 1 to 50 characters'
      using errcode = 'check_violation';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_user_id::text || ':language_boards', 0)
  );

  select * into existing_board
  from public.language_boards
  where user_id = current_user_id
    and lower(name) = lower(normalized_name)
  order by archived_at nulls first, created_at
  limit 1;

  if found and existing_board.archived_at is null then
    raise exception 'An active board with this name already exists'
      using errcode = 'unique_violation';
  end if;

  if found then
    update public.language_boards
    set name = normalized_name, archived_at = null
    where id = existing_board.id
    returning * into result;
    return result;
  end if;

  insert into public.language_boards (user_id, name, position)
  values (
    current_user_id,
    normalized_name,
    coalesce((
      select max(position) + 1
      from public.language_boards
      where user_id = current_user_id and archived_at is null
    ), 0)
  )
  returning * into result;

  return result;
end;
$$;

create or replace function public.create_or_restore_activity_type(p_name text)
returns public.activity_types
language plpgsql
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_name text := btrim(p_name);
  existing_activity public.activity_types;
  result public.activity_types;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = 'insufficient_privilege';
  end if;

  if normalized_name is null or char_length(normalized_name) not between 1 and 50 then
    raise exception 'Activity name must contain 1 to 50 characters'
      using errcode = 'check_violation';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_user_id::text || ':activity_types', 0)
  );

  select * into existing_activity
  from public.activity_types
  where user_id = current_user_id
    and lower(name) = lower(normalized_name)
  order by archived_at nulls first, created_at
  limit 1;

  if found and existing_activity.archived_at is null then
    raise exception 'An active activity with this name already exists'
      using errcode = 'unique_violation';
  end if;

  if found then
    update public.activity_types
    set name = normalized_name, archived_at = null
    where id = existing_activity.id
    returning * into result;
    return result;
  end if;

  insert into public.activity_types (user_id, name, position)
  values (
    current_user_id,
    normalized_name,
    coalesce((
      select max(position) + 1
      from public.activity_types
      where user_id = current_user_id and archived_at is null
    ), 0)
  )
  returning * into result;

  return result;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.activity_types (user_id, name, system_key, position)
  values
    (new.id, 'Reading', 'reading', 0),
    (new.id, 'Podcast', 'podcast', 1),
    (new.id, 'Speaking', 'speaking', 2),
    (new.id, 'Writing', 'writing', 3),
    (new.id, 'Anki', 'anki', 4),
    (new.id, 'Grammar', 'grammar', 5),
    (new.id, 'TV Show / Film', 'tv_show_film', 6)
  on conflict (user_id, system_key) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.language_boards enable row level security;
alter table public.activity_types enable row level security;
alter table public.study_entries enable row level security;

create policy profiles_select_own
on public.profiles for select
to authenticated
using (user_id = (select auth.uid()));

create policy profiles_update_own
on public.profiles for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy language_boards_select_own
on public.language_boards for select
to authenticated
using (user_id = (select auth.uid()));

create policy language_boards_insert_own
on public.language_boards for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy language_boards_update_own
on public.language_boards for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy language_boards_delete_own
on public.language_boards for delete
to authenticated
using (user_id = (select auth.uid()));

create policy activity_types_select_own
on public.activity_types for select
to authenticated
using (user_id = (select auth.uid()));

create policy activity_types_insert_own
on public.activity_types for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy activity_types_update_own
on public.activity_types for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy activity_types_delete_own
on public.activity_types for delete
to authenticated
using (user_id = (select auth.uid()));

create policy study_entries_select_own
on public.study_entries for select
to authenticated
using (user_id = (select auth.uid()));

create policy study_entries_insert_own
on public.study_entries for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy study_entries_update_own
on public.study_entries for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy study_entries_delete_own
on public.study_entries for delete
to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.profiles from anon;
revoke all on table public.language_boards from anon;
revoke all on table public.activity_types from anon;
revoke all on table public.study_entries from anon;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.language_boards to authenticated;
grant select, insert, update, delete on table public.activity_types to authenticated;
grant select, insert, update, delete on table public.study_entries to authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.enforce_active_resource_limit() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.create_or_restore_language_board(text) from public, anon;
revoke all on function public.create_or_restore_activity_type(text) from public, anon;
grant execute on function public.create_or_restore_language_board(text) to authenticated;
grant execute on function public.create_or_restore_activity_type(text) to authenticated;
