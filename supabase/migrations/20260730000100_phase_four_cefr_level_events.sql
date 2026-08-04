create table public.cefr_level_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  board_id uuid not null,
  level text not null,
  effective_date date not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint cefr_level_events_level_valid check (
    level in ('A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2')
  ),
  constraint cefr_level_events_board_owner_fkey foreign key (
    board_id,
    user_id
  ) references public.language_boards (id, user_id) on delete restrict,
  constraint cefr_level_events_board_date_key unique (
    user_id,
    board_id,
    effective_date
  )
);

create index cefr_level_events_board_effective_date_idx
  on public.cefr_level_events (
    user_id,
    board_id,
    effective_date desc,
    created_at desc,
    id desc
  );

create trigger cefr_level_events_set_updated_at
before update on public.cefr_level_events
for each row execute function public.set_updated_at();

alter table public.cefr_level_events enable row level security;

create policy cefr_level_events_select_own
on public.cefr_level_events for select
to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.cefr_level_events from anon, authenticated;
grant select on table public.cefr_level_events to authenticated;

create or replace function public.assert_cefr_history_has_no_adjacent_duplicates(
  p_user_id uuid,
  p_board_id uuid
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from (
      select
        level,
        lag(level) over (
          order by effective_date, created_at, id
        ) as previous_level
      from public.cefr_level_events
      where user_id = p_user_id
        and board_id = p_board_id
    ) as ordered_events
    where previous_level = level
  ) then
    raise exception 'Choose a level different from the current one.'
      using errcode = 'check_violation';
  end if;
end;
$$;

create or replace function public.create_cefr_level_event(
  p_board_id uuid,
  p_level text,
  p_effective_date date,
  p_local_today date
)
returns public.cefr_level_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  result public.cefr_level_events;
begin
  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = 'insufficient_privilege';
  end if;

  if p_level is null or p_level not in ('A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2') then
    raise exception 'Level must be A0, A1, A2, B1, B2, C1, or C2'
      using errcode = 'check_violation';
  end if;

  if p_effective_date is null or p_local_today is null then
    raise exception 'A level update date and local today are required'
      using errcode = 'check_violation';
  end if;

  if p_effective_date > p_local_today then
    raise exception 'Level update date cannot be in the future'
      using errcode = 'check_violation';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      current_user_id::text || ':' || p_board_id::text || ':cefr_level_events',
      0
    )
  );

  if not exists (
    select 1
    from public.language_boards
    where id = p_board_id
      and user_id = current_user_id
      and archived_at is null
  ) then
    raise exception 'Level updates require an active owned language board'
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1
    from public.cefr_level_events
    where user_id = current_user_id
      and board_id = p_board_id
      and effective_date = p_effective_date
  ) then
    raise exception 'A level update already exists for this date'
      using errcode = 'unique_violation';
  end if;

  insert into public.cefr_level_events (
    user_id,
    board_id,
    level,
    effective_date
  )
  values (
    current_user_id,
    p_board_id,
    p_level,
    p_effective_date
  )
  returning * into result;

  perform public.assert_cefr_history_has_no_adjacent_duplicates(
    current_user_id,
    p_board_id
  );

  return result;
end;
$$;

create or replace function public.update_cefr_level_event(
  p_event_id uuid,
  p_level text,
  p_effective_date date,
  p_local_today date
)
returns public.cefr_level_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  existing_event public.cefr_level_events;
  result public.cefr_level_events;
begin
  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = 'insufficient_privilege';
  end if;

  if p_event_id is null then
    raise exception 'A level update identifier is required'
      using errcode = 'check_violation';
  end if;

  if p_level is null or p_level not in ('A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2') then
    raise exception 'Level must be A0, A1, A2, B1, B2, C1, or C2'
      using errcode = 'check_violation';
  end if;

  if p_effective_date is null or p_local_today is null then
    raise exception 'A level update date and local today are required'
      using errcode = 'check_violation';
  end if;

  if p_effective_date > p_local_today then
    raise exception 'Level update date cannot be in the future'
      using errcode = 'check_violation';
  end if;

  select * into existing_event
  from public.cefr_level_events
  where id = p_event_id
    and user_id = current_user_id;

  if not found then
    raise exception 'Level update not found'
      using errcode = 'no_data_found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      current_user_id::text || ':' || existing_event.board_id::text || ':cefr_level_events',
      0
    )
  );

  if not exists (
    select 1
    from public.language_boards
    where id = existing_event.board_id
      and user_id = current_user_id
      and archived_at is null
  ) then
    raise exception 'Level updates require an active owned language board'
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1
    from public.cefr_level_events
    where user_id = current_user_id
      and board_id = existing_event.board_id
      and effective_date = p_effective_date
      and id <> p_event_id
  ) then
    raise exception 'A level update already exists for this date'
      using errcode = 'unique_violation';
  end if;

  update public.cefr_level_events
  set
    level = p_level,
    effective_date = p_effective_date
  where id = p_event_id
    and user_id = current_user_id
  returning * into result;

  perform public.assert_cefr_history_has_no_adjacent_duplicates(
    current_user_id,
    existing_event.board_id
  );

  return result;
end;
$$;

create or replace function public.delete_cefr_level_event(
  p_event_id uuid
)
returns public.cefr_level_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  existing_event public.cefr_level_events;
  result public.cefr_level_events;
begin
  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = 'insufficient_privilege';
  end if;

  if p_event_id is null then
    raise exception 'A level update identifier is required'
      using errcode = 'check_violation';
  end if;

  select * into existing_event
  from public.cefr_level_events
  where id = p_event_id
    and user_id = current_user_id;

  if not found then
    raise exception 'Level update not found'
      using errcode = 'no_data_found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      current_user_id::text || ':' || existing_event.board_id::text || ':cefr_level_events',
      0
    )
  );

  delete from public.cefr_level_events
  where id = p_event_id
    and user_id = current_user_id
  returning * into result;

  perform public.assert_cefr_history_has_no_adjacent_duplicates(
    current_user_id,
    existing_event.board_id
  );

  return result;
end;
$$;

revoke all on function public.assert_cefr_history_has_no_adjacent_duplicates(
  uuid,
  uuid
) from public, anon, authenticated;

revoke all on function public.create_cefr_level_event(
  uuid,
  text,
  date,
  date
) from public, anon;

revoke all on function public.update_cefr_level_event(
  uuid,
  text,
  date,
  date
) from public, anon;

revoke all on function public.delete_cefr_level_event(uuid) from public, anon;

grant execute on function public.create_cefr_level_event(
  uuid,
  text,
  date,
  date
) to authenticated;

grant execute on function public.update_cefr_level_event(
  uuid,
  text,
  date,
  date
) to authenticated;

grant execute on function public.delete_cefr_level_event(uuid) to authenticated;
