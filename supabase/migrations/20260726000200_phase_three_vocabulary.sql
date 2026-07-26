create table public.vocabulary_daily_totals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  board_id uuid not null,
  study_date date not null,
  words_learned integer not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint vocabulary_daily_totals_words_nonnegative check (words_learned >= 0),
  constraint vocabulary_daily_totals_board_owner_fkey foreign key (
    board_id,
    user_id
  ) references public.language_boards (id, user_id) on delete restrict,
  constraint vocabulary_daily_totals_board_date_key unique (
    user_id,
    board_id,
    study_date
  )
);

create trigger vocabulary_daily_totals_set_updated_at
before update on public.vocabulary_daily_totals
for each row execute function public.set_updated_at();

alter table public.vocabulary_daily_totals enable row level security;

create policy vocabulary_daily_totals_select_own
on public.vocabulary_daily_totals for select
to authenticated
using (user_id = (select auth.uid()));

create policy vocabulary_daily_totals_insert_own
on public.vocabulary_daily_totals for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy vocabulary_daily_totals_update_own
on public.vocabulary_daily_totals for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy vocabulary_daily_totals_delete_own
on public.vocabulary_daily_totals for delete
to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.vocabulary_daily_totals from anon, authenticated;
grant select, delete on table public.vocabulary_daily_totals to authenticated;

create or replace function public.upsert_vocabulary_daily_total(
  p_board_id uuid,
  p_study_date date,
  p_words_learned integer
)
returns public.vocabulary_daily_totals
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  result public.vocabulary_daily_totals;
begin
  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = 'insufficient_privilege';
  end if;

  if p_study_date is null then
    raise exception 'A vocabulary study date is required'
      using errcode = 'check_violation';
  end if;

  if p_words_learned is null or p_words_learned < 0 then
    raise exception 'Vocabulary words learned must be a non-negative integer'
      using errcode = 'check_violation';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      current_user_id::text || ':' || p_board_id::text || ':' || p_study_date::text,
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
    raise exception 'Vocabulary totals require an active owned language board'
      using errcode = 'check_violation';
  end if;

  insert into public.vocabulary_daily_totals (
    user_id,
    board_id,
    study_date,
    words_learned
  )
  values (
    current_user_id,
    p_board_id,
    p_study_date,
    p_words_learned
  )
  on conflict (user_id, board_id, study_date)
  do update set words_learned = excluded.words_learned
  returning * into result;

  return result;
end;
$$;

revoke all on function public.upsert_vocabulary_daily_total(
  uuid,
  date,
  integer
) from public, anon;

grant execute on function public.upsert_vocabulary_daily_total(
  uuid,
  date,
  integer
) to authenticated;
