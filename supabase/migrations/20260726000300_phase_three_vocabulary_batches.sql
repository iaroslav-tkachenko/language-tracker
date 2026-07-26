create table public.vocabulary_total_batches (
  id uuid primary key,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  board_id uuid not null,
  start_date date not null,
  end_date date not null,
  words_learned integer not null,
  inserted_count smallint not null default 0,
  preserved_count smallint not null default 0,
  created_at timestamptz not null default statement_timestamp(),
  constraint vocabulary_total_batches_words_nonnegative check (
    words_learned >= 0
  ),
  constraint vocabulary_total_batches_range_ordered check (
    start_date <= end_date
  ),
  constraint vocabulary_total_batches_range_same_year check (
    extract(year from start_date) = extract(year from end_date)
  ),
  constraint vocabulary_total_batches_range_maximum check (
    end_date - start_date between 0 and 365
  ),
  constraint vocabulary_total_batches_counts_nonnegative check (
    inserted_count >= 0 and preserved_count >= 0
  ),
  constraint vocabulary_total_batches_board_owner_fkey foreign key (
    board_id,
    user_id
  ) references public.language_boards (id, user_id) on delete restrict,
  constraint vocabulary_total_batches_id_user_id_key unique (id, user_id)
);

create index vocabulary_total_batches_board_created_idx
  on public.vocabulary_total_batches (user_id, board_id, created_at);

alter table public.vocabulary_total_batches enable row level security;

create policy vocabulary_total_batches_select_own
on public.vocabulary_total_batches for select
to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.vocabulary_total_batches from anon, authenticated;
grant select on table public.vocabulary_total_batches to authenticated;

create or replace function public.create_vocabulary_total_batch(
  p_operation_id uuid,
  p_board_id uuid,
  p_start_date date,
  p_end_date date,
  p_words_learned integer
)
returns public.vocabulary_total_batches
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  existing_batch public.vocabulary_total_batches;
  result public.vocabulary_total_batches;
  created_rows integer;
  total_dates integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = 'insufficient_privilege';
  end if;

  if p_operation_id is null then
    raise exception 'A vocabulary batch operation identifier is required'
      using errcode = 'check_violation';
  end if;

  if p_words_learned is null or p_words_learned < 0 then
    raise exception 'Vocabulary words learned must be a non-negative integer'
      using errcode = 'check_violation';
  end if;

  if p_start_date is null or p_end_date is null or p_start_date > p_end_date then
    raise exception 'Vocabulary batch dates must be ordered'
      using errcode = 'check_violation';
  end if;

  if extract(year from p_start_date) <> extract(year from p_end_date) then
    raise exception 'Vocabulary batch dates must be in one calendar year'
      using errcode = 'check_violation';
  end if;

  if p_end_date - p_start_date > 365 then
    raise exception 'A vocabulary batch can contain at most 366 dates'
      using errcode = 'check_violation';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_operation_id::text, 0)
  );

  select * into existing_batch
  from public.vocabulary_total_batches
  where id = p_operation_id;

  if found then
    if existing_batch.user_id = current_user_id
      and existing_batch.board_id = p_board_id
      and existing_batch.start_date = p_start_date
      and existing_batch.end_date = p_end_date
      and existing_batch.words_learned = p_words_learned
    then
      return existing_batch;
    end if;

    raise exception 'Vocabulary batch operation identifier already has another payload'
      using errcode = 'unique_violation';
  end if;

  if not exists (
    select 1
    from public.language_boards
    where id = p_board_id
      and user_id = current_user_id
      and archived_at is null
  ) then
    raise exception 'Vocabulary batches require an active owned language board'
      using errcode = 'check_violation';
  end if;

  total_dates := p_end_date - p_start_date + 1;

  insert into public.vocabulary_total_batches (
    id,
    user_id,
    board_id,
    start_date,
    end_date,
    words_learned
  )
  values (
    p_operation_id,
    current_user_id,
    p_board_id,
    p_start_date,
    p_end_date,
    p_words_learned
  );

  insert into public.vocabulary_daily_totals (
    user_id,
    board_id,
    study_date,
    words_learned
  )
  select
    current_user_id,
    p_board_id,
    generated_date::date,
    p_words_learned
  from pg_catalog.generate_series(
    p_start_date::timestamp,
    p_end_date::timestamp,
    interval '1 day'
  ) as generated_date
  on conflict (user_id, board_id, study_date) do nothing;

  get diagnostics created_rows = row_count;

  update public.vocabulary_total_batches
  set
    inserted_count = created_rows,
    preserved_count = total_dates - created_rows
  where id = p_operation_id
  returning * into result;

  return result;
end;
$$;

revoke all on function public.create_vocabulary_total_batch(
  uuid,
  uuid,
  date,
  date,
  integer
) from public, anon;

grant execute on function public.create_vocabulary_total_batch(
  uuid,
  uuid,
  date,
  date,
  integer
) to authenticated;
