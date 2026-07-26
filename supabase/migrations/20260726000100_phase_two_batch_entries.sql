create table public.study_entry_batches (
  id uuid primary key,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  board_id uuid not null,
  activity_type_id uuid not null,
  start_date date not null,
  end_date date not null,
  duration_minutes smallint not null,
  created_at timestamptz not null default statement_timestamp(),
  constraint study_entry_batches_duration_valid check (
    duration_minutes between 1 and 1440
  ),
  constraint study_entry_batches_range_ordered check (
    start_date <= end_date
  ),
  constraint study_entry_batches_range_same_year check (
    extract(year from start_date) = extract(year from end_date)
  ),
  constraint study_entry_batches_range_maximum check (
    end_date - start_date between 0 and 365
  ),
  constraint study_entry_batches_board_owner_fkey foreign key (
    board_id,
    user_id
  ) references public.language_boards (id, user_id) on delete restrict,
  constraint study_entry_batches_activity_owner_fkey foreign key (
    activity_type_id,
    user_id
  ) references public.activity_types (id, user_id) on delete restrict,
  constraint study_entry_batches_id_user_id_key unique (id, user_id)
);

create index study_entry_batches_board_created_idx
  on public.study_entry_batches (user_id, board_id, created_at);

alter table public.study_entries
  add column batch_id uuid,
  add constraint study_entries_batch_owner_fkey foreign key (
    batch_id,
    user_id
  ) references public.study_entry_batches (id, user_id) on delete restrict;

create unique index study_entries_batch_date_key
  on public.study_entries (batch_id, study_date)
  where batch_id is not null;

alter table public.study_entry_batches enable row level security;

create policy study_entry_batches_select_own
on public.study_entry_batches for select
to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.study_entry_batches from anon, authenticated;
grant select on table public.study_entry_batches to authenticated;

-- Keep batch provenance server-controlled. Single-day creation may insert only
-- the fields it owns, and editing may not move an entry into or out of a batch.
revoke insert, update on table public.study_entries from authenticated;
grant insert (
  user_id,
  board_id,
  activity_type_id,
  study_date,
  duration_minutes
) on table public.study_entries to authenticated;
grant update (
  activity_type_id,
  duration_minutes
) on table public.study_entries to authenticated;

create or replace function public.create_study_entry_batch(
  p_operation_id uuid,
  p_board_id uuid,
  p_activity_type_id uuid,
  p_start_date date,
  p_end_date date,
  p_duration_minutes smallint
)
returns public.study_entry_batches
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  existing_batch public.study_entry_batches;
  result public.study_entry_batches;
begin
  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = 'insufficient_privilege';
  end if;

  if p_operation_id is null then
    raise exception 'A batch operation identifier is required'
      using errcode = 'check_violation';
  end if;

  if p_duration_minutes is null or p_duration_minutes not between 1 and 1440 then
    raise exception 'Batch duration must be between 1 and 1440 minutes'
      using errcode = 'check_violation';
  end if;

  if p_start_date is null or p_end_date is null or p_start_date > p_end_date then
    raise exception 'Batch dates must be ordered'
      using errcode = 'check_violation';
  end if;

  if extract(year from p_start_date) <> extract(year from p_end_date) then
    raise exception 'Batch dates must be in one calendar year'
      using errcode = 'check_violation';
  end if;

  if p_end_date - p_start_date > 365 then
    raise exception 'A batch can contain at most 366 dates'
      using errcode = 'check_violation';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_operation_id::text, 0)
  );

  select * into existing_batch
  from public.study_entry_batches
  where id = p_operation_id;

  if found then
    if existing_batch.user_id = current_user_id
      and existing_batch.board_id = p_board_id
      and existing_batch.activity_type_id = p_activity_type_id
      and existing_batch.start_date = p_start_date
      and existing_batch.end_date = p_end_date
      and existing_batch.duration_minutes = p_duration_minutes
    then
      return existing_batch;
    end if;

    raise exception 'Batch operation identifier already has another payload'
      using errcode = 'unique_violation';
  end if;

  if not exists (
    select 1
    from public.language_boards
    where id = p_board_id
      and user_id = current_user_id
      and archived_at is null
  ) then
    raise exception 'Batch entries require an active owned language board'
      using errcode = 'check_violation';
  end if;

  if not exists (
    select 1
    from public.activity_types
    where id = p_activity_type_id
      and user_id = current_user_id
      and archived_at is null
  ) then
    raise exception 'Batch entries require an active owned activity type'
      using errcode = 'check_violation';
  end if;

  insert into public.study_entry_batches (
    id,
    user_id,
    board_id,
    activity_type_id,
    start_date,
    end_date,
    duration_minutes
  )
  values (
    p_operation_id,
    current_user_id,
    p_board_id,
    p_activity_type_id,
    p_start_date,
    p_end_date,
    p_duration_minutes
  )
  returning * into result;

  insert into public.study_entries (
    user_id,
    board_id,
    activity_type_id,
    study_date,
    duration_minutes,
    batch_id
  )
  select
    current_user_id,
    p_board_id,
    p_activity_type_id,
    generated_date::date,
    p_duration_minutes,
    p_operation_id
  from pg_catalog.generate_series(
    p_start_date::timestamp,
    p_end_date::timestamp,
    interval '1 day'
  ) as generated_date;

  return result;
end;
$$;

revoke all on function public.create_study_entry_batch(
  uuid,
  uuid,
  uuid,
  date,
  date,
  smallint
) from public, anon;

grant execute on function public.create_study_entry_batch(
  uuid,
  uuid,
  uuid,
  date,
  date,
  smallint
) to authenticated;
