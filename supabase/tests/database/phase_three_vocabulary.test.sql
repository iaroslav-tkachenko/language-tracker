begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

select has_table(
  'public',
  'vocabulary_daily_totals',
  'vocabulary daily totals table exists'
);
select col_is_pk(
  'public',
  'vocabulary_daily_totals',
  'id',
  'vocabulary rows have stable identifiers'
);
select col_type_is(
  'public',
  'vocabulary_daily_totals',
  'study_date',
  'date',
  'vocabulary dates are local calendar dates'
);
select policies_are(
  'public',
  'vocabulary_daily_totals',
  array[
    'vocabulary_daily_totals_delete_own',
    'vocabulary_daily_totals_insert_own',
    'vocabulary_daily_totals_select_own',
    'vocabulary_daily_totals_update_own'
  ],
  'vocabulary rows have explicit owner policies for every operation'
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
    '40000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'phase-three-a@example.com',
    extensions.crypt('test-password-a', extensions.gen_salt('bf')),
    statement_timestamp(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    statement_timestamp(),
    statement_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '40000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'phase-three-b@example.com',
    extensions.crypt('test-password-b', extensions.gen_salt('bf')),
    statement_timestamp(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    statement_timestamp(),
    statement_timestamp()
  );

insert into public.language_boards (id, user_id, name)
values
  (
    '41000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'German'
  ),
  (
    '41000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    'Italian'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    select public.upsert_vocabulary_daily_total(
      '41000000-0000-4000-8000-000000000001',
      date '2026-07-26',
      12
    )
  $$,
  'an owner can create a vocabulary total'
);
select is(
  (
    select words_learned
    from public.vocabulary_daily_totals
    where board_id = '41000000-0000-4000-8000-000000000001'
      and study_date = date '2026-07-26'
  ),
  12,
  'the created total is readable by its owner'
);

select lives_ok(
  $$
    select public.upsert_vocabulary_daily_total(
      '41000000-0000-4000-8000-000000000001',
      date '2026-07-26',
      18
    )
  $$,
  'saving the same board and date updates atomically'
);
select is(
  (
    select count(*)
    from public.vocabulary_daily_totals
    where board_id = '41000000-0000-4000-8000-000000000001'
      and study_date = date '2026-07-26'
  ),
  1::bigint,
  'the unique board and date key prevents duplicates'
);
select is(
  (
    select words_learned
    from public.vocabulary_daily_totals
    where board_id = '41000000-0000-4000-8000-000000000001'
      and study_date = date '2026-07-26'
  ),
  18,
  'the second save replaces the final daily total'
);

select lives_ok(
  $$
    select public.upsert_vocabulary_daily_total(
      '41000000-0000-4000-8000-000000000001',
      date '2026-07-26',
      0
    )
  $$,
  'an existing daily total can be edited to zero words'
);
select is(
  (
    select words_learned
    from public.vocabulary_daily_totals
    where board_id = '41000000-0000-4000-8000-000000000001'
      and study_date = date '2026-07-26'
  ),
  0,
  'the explicit zero total remains readable without creating another row'
);

select throws_ok(
  $$
    select public.upsert_vocabulary_daily_total(
      '41000000-0000-4000-8000-000000000002',
      date '2026-07-27',
      5
    )
  $$,
  '23514',
  'Vocabulary totals require an active owned language board',
  'another user board cannot receive a vocabulary total'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.vocabulary_daily_totals),
  0::bigint,
  'user B cannot read user A vocabulary'
);
with deleted as (
  delete from public.vocabulary_daily_totals
  where board_id = '41000000-0000-4000-8000-000000000001'
  returning id
)
select is(
  (select count(*) from deleted),
  0::bigint,
  'user B cannot delete user A vocabulary'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

delete from public.vocabulary_daily_totals
where board_id = '41000000-0000-4000-8000-000000000001'
  and study_date = date '2026-07-26';
select is(
  (select count(*) from public.vocabulary_daily_totals),
  0::bigint,
  'the owner can delete a vocabulary total'
);

reset role;

update public.language_boards
set archived_at = statement_timestamp()
where id = '41000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    select public.upsert_vocabulary_daily_total(
      '41000000-0000-4000-8000-000000000001',
      date '2026-07-28',
      9
    )
  $$,
  '23514',
  'Vocabulary totals require an active owned language board',
  'an archived board cannot receive a vocabulary total'
);

reset role;

select * from finish();
rollback;
