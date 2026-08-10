begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

select has_table(
  'public',
  'study_entry_batches',
  'study_entry_batches table exists'
);
select has_column(
  'public',
  'study_entries',
  'batch_id',
  'study entries record nullable batch provenance'
);
select col_is_pk(
  'public',
  'study_entry_batches',
  'id',
  'the client operation identifier is the batch primary key'
);
select policies_are(
  'public',
  'study_entry_batches',
  array['study_entry_batches_select_own'],
  'batch rows expose only an owner-select policy'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '30000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'phase-two-a@example.com',
    extensions.crypt('test-password-a', extensions.gen_salt('bf')),
    statement_timestamp(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    statement_timestamp(),
    statement_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '30000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'phase-two-b@example.com',
    extensions.crypt('test-password-b', extensions.gen_salt('bf')),
    statement_timestamp(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    statement_timestamp(),
    statement_timestamp()
  );

insert into public.language_boards (id, user_id, name)
values (
  '31000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  'German'
);

insert into public.activity_types (id, user_id, name, position)
values (
  '31000000-0000-4000-8000-000000000010',
  '30000000-0000-4000-8000-000000000001',
  'Custom archive fixture',
  9
);

create or replace function public.inject_phase_two_batch_failure()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.batch_id = '32000000-0000-4000-8000-000000000005'::uuid then
    raise exception 'Injected batch failure';
  end if;
  return new;
end;
$$;

create trigger inject_phase_two_batch_failure
before insert on public.study_entries
for each row execute function public.inject_phase_two_batch_failure();

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    insert into public.study_entry_batches (
      id,
      user_id,
      board_id,
      activity_type_id,
      start_date,
      end_date,
      duration_minutes
    )
    select
      '32000000-0000-4000-8000-000000000099',
      '30000000-0000-4000-8000-000000000001',
      '31000000-0000-4000-8000-000000000001',
      id,
      date '2026-07-01',
      date '2026-07-02',
      30::smallint
    from public.activity_types
    where system_key = 'reading'
  $$,
  '42501',
  'permission denied for table study_entry_batches',
  'direct batch inserts are denied'
);

select lives_ok(
  $$
    select public.create_study_entry_batch(
      '32000000-0000-4000-8000-000000000001',
      '31000000-0000-4000-8000-000000000001',
      (select id from public.activity_types where system_key = 'reading'),
      date '2026-07-01',
      date '2026-07-01',
      30::smallint
    )
  $$,
  'a one-day batch creates successfully'
);
select is(
  (
    select count(*)
    from public.study_entries
    where batch_id = '32000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'a one-day batch creates one independent entry'
);

insert into public.study_entries (
  user_id,
  board_id,
  activity_type_id,
  study_date,
  duration_minutes
)
select
  '30000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000001',
  id,
  date '2026-07-02',
  30::smallint
from public.activity_types
where system_key = 'reading';

select lives_ok(
  $$
    select public.create_study_entry_batch(
      '32000000-0000-4000-8000-000000000002',
      '31000000-0000-4000-8000-000000000001',
      (select id from public.activity_types where system_key = 'reading'),
      date '2026-07-02',
      date '2026-07-04',
      30::smallint
    )
  $$,
  'a multi-day batch creates successfully beside matching entries'
);
select is(
  (
    select count(*)
    from public.study_entries
    where batch_id = '32000000-0000-4000-8000-000000000002'
  ),
  3::bigint,
  'the inclusive three-day range creates three entries'
);
select is(
  (
    select count(*)
    from public.study_entries
    where study_date = date '2026-07-02'
      and duration_minutes = 30
  ),
  2::bigint,
  'an existing matching entry is preserved and receives another entry'
);

select lives_ok(
  $$
    select public.create_study_entry_batch(
      '32000000-0000-4000-8000-000000000002',
      '31000000-0000-4000-8000-000000000001',
      (select id from public.activity_types where system_key = 'reading'),
      date '2026-07-02',
      date '2026-07-04',
      30::smallint
    )
  $$,
  'retrying the same operation and payload succeeds'
);
select is(
  (
    select count(*)
    from public.study_entries
    where batch_id = '32000000-0000-4000-8000-000000000002'
  ),
  3::bigint,
  'retrying the same operation does not duplicate entries'
);

select throws_ok(
  $$
    select public.create_study_entry_batch(
      '32000000-0000-4000-8000-000000000002',
      '31000000-0000-4000-8000-000000000001',
      (select id from public.activity_types where system_key = 'reading'),
      date '2026-07-02',
      date '2026-07-04',
      45::smallint
    )
  $$,
  '23505',
  'Batch operation identifier already has another payload',
  'reusing an operation identifier with another payload is rejected'
);

select lives_ok(
  $$
    select public.create_study_entry_batch(
      '32000000-0000-4000-8000-000000000003',
      '31000000-0000-4000-8000-000000000001',
      (select id from public.activity_types where system_key = 'reading'),
      date '2028-01-01',
      date '2028-12-31',
      10::smallint
    )
  $$,
  'a leap-year 366-day batch succeeds'
);
select is(
  (
    select count(*)
    from public.study_entries
    where batch_id = '32000000-0000-4000-8000-000000000003'
  ),
  366::bigint,
  'the leap-year batch creates all 366 dates'
);

select lives_ok(
  $$
    select public.create_study_entry_batch(
      '32000000-0000-4000-8000-000000000004',
      '31000000-0000-4000-8000-000000000001',
      (select id from public.activity_types where system_key = 'reading'),
      date '2027-01-01',
      date '2027-12-31',
      10::smallint
    )
  $$,
  'a regular full-year 365-day batch succeeds'
);
select is(
  (
    select count(*)
    from public.study_entries
    where batch_id = '32000000-0000-4000-8000-000000000004'
  ),
  365::bigint,
  'the regular-year batch creates all 365 dates'
);

select throws_ok(
  $$
    select public.create_study_entry_batch(
      '32000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000001',
      (select id from public.activity_types where system_key = 'reading'),
      date '2026-07-10',
      date '2026-07-01',
      30::smallint
    )
  $$,
  '23514',
  'Batch dates must be ordered',
  'a reversed range is rejected'
);

select throws_ok(
  $$
    select public.create_study_entry_batch(
      '32000000-0000-4000-8000-000000000011',
      '31000000-0000-4000-8000-000000000001',
      (select id from public.activity_types where system_key = 'reading'),
      date '2026-12-31',
      date '2027-01-01',
      30::smallint
    )
  $$,
  '23514',
  'Batch dates must be in one calendar year',
  'a cross-year range is rejected'
);

select throws_ok(
  $$
    select public.create_study_entry_batch(
      '32000000-0000-4000-8000-000000000005',
      '31000000-0000-4000-8000-000000000001',
      (select id from public.activity_types where system_key = 'reading'),
      date '2026-08-01',
      date '2026-08-03',
      30::smallint
    )
  $$,
  'P0001',
  'Injected batch failure',
  'an injected entry failure aborts the batch operation'
);
select is(
  (
    select count(*)
    from public.study_entry_batches
    where id = '32000000-0000-4000-8000-000000000005'
  ),
  0::bigint,
  'an injected failure leaves no batch row'
);
select is(
  (
    select count(*)
    from public.study_entries
    where batch_id = '32000000-0000-4000-8000-000000000005'
  ),
  0::bigint,
  'an injected failure leaves no generated entries'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.study_entry_batches),
  0::bigint,
  'user B cannot select user A batch rows'
);
select throws_ok(
  $$
    select public.create_study_entry_batch(
      '32000000-0000-4000-8000-000000000020',
      '31000000-0000-4000-8000-000000000001',
      (
        select id
        from public.activity_types
        where system_key = 'reading'
      ),
      date '2026-09-01',
      date '2026-09-02',
      30::smallint
    )
  $$,
  '23514',
  'Batch entries require an active owned language board',
  'user B cannot create a batch with user A resources'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

update public.activity_types
set archived_at = statement_timestamp()
where id = '31000000-0000-4000-8000-000000000010';

select throws_ok(
  $$
    select public.create_study_entry_batch(
      '32000000-0000-4000-8000-000000000022',
      '31000000-0000-4000-8000-000000000001',
      '31000000-0000-4000-8000-000000000010',
      date '2026-09-01',
      date '2026-09-02',
      30::smallint
    )
  $$,
  '23514',
  'Batch entries require an active owned activity type',
  'an archived activity cannot receive a new batch'
);

update public.language_boards
set archived_at = statement_timestamp()
where id = '31000000-0000-4000-8000-000000000001';

select throws_ok(
  $$
    select public.create_study_entry_batch(
      '32000000-0000-4000-8000-000000000021',
      '31000000-0000-4000-8000-000000000001',
      (select id from public.activity_types where system_key = 'reading'),
      date '2026-09-01',
      date '2026-09-02',
      30::smallint
    )
  $$,
  '23514',
  'Batch entries require an active owned language board',
  'an archived board cannot receive a new batch'
);

reset role;

select * from finish();
rollback;
