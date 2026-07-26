begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

select has_table(
  'public',
  'vocabulary_total_batches',
  'vocabulary total batches table exists'
);
select policies_are(
  'public',
  'vocabulary_total_batches',
  array['vocabulary_total_batches_select_own'],
  'vocabulary batches expose only owner reads'
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
    '60000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'vocabulary-batch-a@example.com',
    extensions.crypt('test-password-a', extensions.gen_salt('bf')),
    statement_timestamp(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    statement_timestamp(),
    statement_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '60000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'vocabulary-batch-b@example.com',
    extensions.crypt('test-password-b', extensions.gen_salt('bf')),
    statement_timestamp(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    statement_timestamp(),
    statement_timestamp()
  );

insert into public.language_boards (id, user_id, name)
values (
  '61000000-0000-4000-8000-000000000001',
  '60000000-0000-4000-8000-000000000001',
  'German'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    select public.create_vocabulary_total_batch(
      '62000000-0000-4000-8000-000000000001',
      '61000000-0000-4000-8000-000000000001',
      date '2026-07-01',
      date '2026-07-03',
      10
    )
  $$,
  'a vocabulary batch creates one total per empty date'
);
select is(
  (
    select count(*)
    from public.vocabulary_daily_totals
    where board_id = '61000000-0000-4000-8000-000000000001'
  ),
  3::bigint,
  'the inclusive three-day range creates three totals'
);

select lives_ok(
  $$
    select public.upsert_vocabulary_daily_total(
      '61000000-0000-4000-8000-000000000001',
      date '2026-07-04',
      7
    )
  $$,
  'an existing daily total is prepared'
);
select lives_ok(
  $$
    select public.create_vocabulary_total_batch(
      '62000000-0000-4000-8000-000000000002',
      '61000000-0000-4000-8000-000000000001',
      date '2026-07-03',
      date '2026-07-05',
      20
    )
  $$,
  'a batch succeeds across existing dates'
);
select is(
  (
    select words_learned
    from public.vocabulary_daily_totals
    where board_id = '61000000-0000-4000-8000-000000000001'
      and study_date = date '2026-07-03'
  ),
  10,
  'a value from an earlier batch is preserved'
);
select is(
  (
    select words_learned
    from public.vocabulary_daily_totals
    where board_id = '61000000-0000-4000-8000-000000000001'
      and study_date = date '2026-07-04'
  ),
  7,
  'a single-day value is preserved'
);
select is(
  (
    select inserted_count
    from public.vocabulary_total_batches
    where id = '62000000-0000-4000-8000-000000000002'
  ),
  1::smallint,
  'the batch reports one inserted date'
);
select is(
  (
    select preserved_count
    from public.vocabulary_total_batches
    where id = '62000000-0000-4000-8000-000000000002'
  ),
  2::smallint,
  'the batch reports two preserved dates'
);

select lives_ok(
  $$
    select public.create_vocabulary_total_batch(
      '62000000-0000-4000-8000-000000000002',
      '61000000-0000-4000-8000-000000000001',
      date '2026-07-03',
      date '2026-07-05',
      20
    )
  $$,
  'retrying the same operation succeeds'
);
select is(
  (
    select count(*)
    from public.vocabulary_daily_totals
    where board_id = '61000000-0000-4000-8000-000000000001'
  ),
  5::bigint,
  'retrying the same operation creates no duplicates'
);

select throws_ok(
  $$
    select public.create_vocabulary_total_batch(
      '62000000-0000-4000-8000-000000000002',
      '61000000-0000-4000-8000-000000000001',
      date '2026-07-03',
      date '2026-07-05',
      21
    )
  $$,
  '23505',
  'Vocabulary batch operation identifier already has another payload',
  'a reused operation identifier rejects a conflicting payload'
);

select lives_ok(
  $$
    select public.create_vocabulary_total_batch(
      '62000000-0000-4000-8000-000000000003',
      '61000000-0000-4000-8000-000000000001',
      date '2028-01-01',
      date '2028-12-31',
      0
    )
  $$,
  'a leap-year batch can explicitly record zero words'
);
select is(
  (
    select count(*)
    from public.vocabulary_daily_totals
    where board_id = '61000000-0000-4000-8000-000000000001'
      and study_date between date '2028-01-01' and date '2028-12-31'
  ),
  366::bigint,
  'the leap-year batch creates all 366 empty dates'
);

select throws_ok(
  $$
    select public.create_vocabulary_total_batch(
      '62000000-0000-4000-8000-000000000010',
      '61000000-0000-4000-8000-000000000001',
      date '2026-12-31',
      date '2027-01-01',
      10
    )
  $$,
  '23514',
  'Vocabulary batch dates must be in one calendar year',
  'a cross-year vocabulary batch is rejected'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
select is(
  (select count(*) from public.vocabulary_total_batches),
  0::bigint,
  'user B cannot read user A vocabulary batches'
);
select throws_ok(
  $$
    select public.create_vocabulary_total_batch(
      '62000000-0000-4000-8000-000000000020',
      '61000000-0000-4000-8000-000000000001',
      date '2026-08-01',
      date '2026-08-02',
      10
    )
  $$,
  '23514',
  'Vocabulary batches require an active owned language board',
  'user B cannot create a batch on user A board'
);

reset role;

select * from finish();
rollback;
