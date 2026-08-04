begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'language_boards', 'language_boards table exists');
select has_table('public', 'activity_types', 'activity_types table exists');
select has_table('public', 'study_entries', 'study_entries table exists');

select col_is_pk('public', 'profiles', 'user_id', 'profiles.user_id is the primary key');
select col_type_is(
  'public',
  'study_entries',
  'study_date',
  'date',
  'study_entries uses a calendar date'
);
select col_type_is(
  'public',
  'study_entries',
  'duration_minutes',
  'smallint',
  'study duration uses exact integer minutes'
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
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'phase-zero-a@example.com',
    extensions.crypt('test-password-a', extensions.gen_salt('bf')),
    statement_timestamp(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    statement_timestamp(),
    statement_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'phase-zero-b@example.com',
    extensions.crypt('test-password-b', extensions.gen_salt('bf')),
    statement_timestamp(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    statement_timestamp(),
    statement_timestamp()
  );

select is(
  (select count(*) from public.profiles),
  2::bigint,
  'new auth users receive profiles'
);
select is(
  (select count(*) from public.activity_types),
  18::bigint,
  'new auth users receive nine standard activities each'
);

insert into public.language_boards (id, user_id, name)
values (
  '11000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'German'
);

insert into public.activity_types (id, user_id, name, position)
values (
  '12000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Conversation practice',
  9
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.profiles),
  1::bigint,
  'user A can select only their own profile'
);
select is(
  (select count(*) from public.activity_types),
  10::bigint,
  'user A can select only their own activities'
);

select throws_ok(
  $$
    update public.activity_types
    set archived_at = statement_timestamp()
    where name = 'Reading'
  $$,
  '23514',
  'System activities cannot be archived',
  'system activities cannot be archived'
);

select throws_ok(
  $$
    insert into public.language_boards (user_id, name)
    values ('10000000-0000-0000-0000-000000000001', 'Bypassed board')
  $$,
  '42501',
  'permission denied for table language_boards',
  'direct board inserts are denied'
);

select throws_ok(
  $$
    insert into public.activity_types (user_id, name)
    values ('10000000-0000-0000-0000-000000000001', 'Bypassed activity')
  $$,
  '42501',
  'permission denied for table activity_types',
  'direct activity inserts are denied'
);

select lives_ok(
  $$ select public.create_or_restore_language_board('French') $$,
  'user A can create a board through the guarded function'
);
select lives_ok(
  $$ select public.create_or_restore_activity_type('Language exchange') $$,
  'user A can create a custom activity through the guarded function'
);

select lives_ok(
  $$
    insert into public.study_entries (
      user_id,
      board_id,
      activity_type_id,
      study_date,
      duration_minutes
    )
    values (
      '10000000-0000-0000-0000-000000000001',
      '11000000-0000-0000-0000-000000000001',
      '12000000-0000-0000-0000-000000000001',
      date '2026-07-17',
      30
    )
  $$,
  'user A can create an entry against active owned resources'
);

select throws_ok(
  $$
    insert into public.study_entries (
      user_id,
      board_id,
      activity_type_id,
      study_date,
      duration_minutes
    )
    values (
      '10000000-0000-0000-0000-000000000001',
      '11000000-0000-0000-0000-000000000001',
      '12000000-0000-0000-0000-000000000001',
      date '2026-07-17',
      0
    )
  $$,
  '23514',
  'new row for relation "study_entries" violates check constraint "study_entries_duration_valid"',
  'zero-minute entries are rejected'
);

update public.activity_types
set archived_at = statement_timestamp()
where name = 'Conversation practice';

select throws_ok(
  $$
    insert into public.study_entries (
      user_id,
      board_id,
      activity_type_id,
      study_date,
      duration_minutes
    )
    values (
      '10000000-0000-0000-0000-000000000001',
      '11000000-0000-0000-0000-000000000001',
      '12000000-0000-0000-0000-000000000001',
      date '2026-07-18',
      30
    )
  $$,
  '23514',
  'Study entries require an active owned activity type',
  'archived activities cannot receive new entries'
);

select lives_ok(
  $$ select public.create_or_restore_activity_type('conversation practice') $$,
  'a case-insensitive archived-name match restores the activity'
);
select is(
  (
    select count(*)
    from public.activity_types
    where lower(name) = 'conversation practice' and archived_at is null
  ),
  1::bigint,
  'restoration reuses one active activity identity'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.study_entries),
  0::bigint,
  'user B cannot select user A study entries'
);
select is(
  (select count(*) from public.language_boards),
  0::bigint,
  'user B cannot select user A boards'
);

select throws_ok(
  $$
    insert into public.study_entries (
      user_id,
      board_id,
      activity_type_id,
      study_date,
      duration_minutes
    )
    values (
      '20000000-0000-0000-0000-000000000002',
      '11000000-0000-0000-0000-000000000001',
      '12000000-0000-0000-0000-000000000001',
      date '2026-07-17',
      30
    )
  $$,
  '23514',
  'Study entries require an active owned language board',
  'user B cannot create an entry with user A resources'
);

select lives_ok(
  $$ select public.create_or_restore_language_board('English') $$,
  'user B can create their first board'
);
select lives_ok(
  $$ select public.create_or_restore_language_board('Italian') $$,
  'user B can create their second board'
);
select lives_ok(
  $$ select public.create_or_restore_language_board('French') $$,
  'user B can create their third board'
);
select lives_ok(
  $$ select public.create_or_restore_language_board('Spanish') $$,
  'user B can create their fourth board'
);
select lives_ok(
  $$ select public.create_or_restore_language_board('Polish') $$,
  'user B can create their fifth board'
);
select lives_ok(
  $$ select public.create_or_restore_language_board('Ukrainian') $$,
  'user B can create their sixth board'
);
select throws_ok(
  $$ select public.create_or_restore_language_board('Dutch') $$,
  '23514',
  'Active language_boards limit of 6 reached',
  'a seventh active board is rejected'
);

reset role;

select * from finish();
rollback;
