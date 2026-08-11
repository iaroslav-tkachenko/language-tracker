alter table public.vocabulary_total_batches
  drop constraint vocabulary_total_batches_counts_nonnegative;

alter table public.vocabulary_total_batches
  rename column preserved_count to updated_count;

alter table public.vocabulary_total_batches
  add constraint vocabulary_total_batches_counts_nonnegative check (
    inserted_count >= 0 and updated_count >= 0
  );

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
  existing_rows integer;
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

  select count(*) into existing_rows
  from public.vocabulary_daily_totals
  where user_id = current_user_id
    and board_id = p_board_id
    and study_date between p_start_date and p_end_date;

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
  on conflict (user_id, board_id, study_date)
  do update set
    words_learned = excluded.words_learned,
    updated_at = statement_timestamp();

  update public.vocabulary_total_batches
  set
    inserted_count = total_dates - existing_rows,
    updated_count = existing_rows
  where id = p_operation_id
  returning * into result;

  return result;
end;
$$;
