begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

select has_table(
  'public',
  'cefr_level_events',
  'cefr level events table exists'
);
select col_is_pk(
  'public',
  'cefr_level_events',
  'id',
  'cefr rows have stable identifiers'
);
select col_type_is(
  'public',
  'cefr_level_events',
  'effective_date',
  'date',
  'cefr effective dates are local calendar dates'
);
select policies_are(
  'public',
  'cefr_level_events',
  array['cefr_level_events_select_own'],
  'cefr rows expose only an owner-select policy'
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
    '50000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'phase-four-a@example.com',
    extensions.crypt('test-password-a', extensions.gen_salt('bf')),
    statement_timestamp(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    statement_timestamp(),
    statement_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '50000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'phase-four-b@example.com',
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
    '51000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'German'
  ),
  (
    '51000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000002',
    'Italian'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"50000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    insert into public.cefr_level_events (
      user_id,
      board_id,
      level,
      effective_date
    )
    values (
      '50000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000001',
      'A0',
      date '2024-01-01'
    )
  $$,
  '42501',
  'permission denied for table cefr_level_events',
  'direct CEFR inserts are denied'
);

select lives_ok(
  $$
    select public.create_cefr_level_event(
      '51000000-0000-4000-8000-000000000001',
      'A0',
      date '2024-01-01',
      date '2026-07-30'
    )
  $$,
  'an owner can create the A0 starting state'
);
select lives_ok(
  $$
    select public.create_cefr_level_event(
      '51000000-0000-4000-8000-000000000001',
      'A1',
      date '2024-06-01',
      date '2026-07-30'
    )
  $$,
  'an owner can create a later level update'
);

select is(
  (
    select level
    from public.cefr_level_events
    where board_id = '51000000-0000-4000-8000-000000000001'
    order by effective_date desc, created_at desc, id desc
    limit 1
  ),
  'A1',
  'the greatest effective date derives the current level'
);

select throws_ok(
  $$
    select public.create_cefr_level_event(
      '51000000-0000-4000-8000-000000000001',
      'A2',
      date '2024-06-01',
      date '2026-07-30'
    )
  $$,
  '23505',
  'A level update already exists for this date',
  'a second level update on the same date is rejected'
);

select throws_ok(
  $$
    select public.create_cefr_level_event(
      '51000000-0000-4000-8000-000000000001',
      'A1',
      date '2024-07-01',
      date '2026-07-30'
    )
  $$,
  '23514',
  'Choose a level different from the current one.',
  'chronologically adjacent duplicate levels are rejected'
);

select lives_ok(
  $$
    select public.create_cefr_level_event(
      '51000000-0000-4000-8000-000000000001',
      'B1',
      date '2024-07-01',
      date '2026-07-30'
    )
  $$,
  'a different adjacent level can be added'
);
select lives_ok(
  $$
    select public.create_cefr_level_event(
      '51000000-0000-4000-8000-000000000001',
      'A1',
      date '2024-08-01',
      date '2026-07-30'
    )
  $$,
  'a non-adjacent return to a previous level is allowed'
);

select throws_ok(
  $$
    select public.create_cefr_level_event(
      '51000000-0000-4000-8000-000000000001',
      'B2',
      date '2026-08-01',
      date '2026-07-30'
    )
  $$,
  '23514',
  'Level update date cannot be in the future',
  'future effective dates are rejected by local today'
);

select throws_ok(
  $$
    select public.create_cefr_level_event(
      '51000000-0000-4000-8000-000000000001',
      'D1',
      date '2024-09-01',
      date '2026-07-30'
    )
  $$,
  '23514',
  'Level must be A0, A1, A2, B1, B2, C1, or C2',
  'unknown levels are rejected'
);

select throws_ok(
  $$
    select public.update_cefr_level_event(
      (
        select id
        from public.cefr_level_events
        where board_id = '51000000-0000-4000-8000-000000000001'
          and effective_date = date '2024-08-01'
      ),
      'B1',
      date '2024-08-01',
      date '2026-07-30'
    )
  $$,
  '23514',
  'Choose a level different from the current one.',
  'editing cannot create adjacent duplicate levels'
);

select throws_ok(
  $$
    select public.update_cefr_level_event(
      (
        select id
        from public.cefr_level_events
        where board_id = '51000000-0000-4000-8000-000000000001'
          and effective_date = date '2024-08-01'
      ),
      'B2',
      date '2024-07-01',
      date '2026-07-30'
    )
  $$,
  '23505',
  'A level update already exists for this date',
  'editing onto an occupied date is rejected'
);

select lives_ok(
  $$
    select public.update_cefr_level_event(
      (
        select id
        from public.cefr_level_events
        where board_id = '51000000-0000-4000-8000-000000000001'
          and effective_date = date '2024-08-01'
      ),
      'B2',
      date '2024-09-01',
      date '2026-07-30'
    )
  $$,
  'an owner can edit a level and date without violating history'
);
select is(
  (
    select level
    from public.cefr_level_events
    where board_id = '51000000-0000-4000-8000-000000000001'
    order by effective_date desc, created_at desc, id desc
    limit 1
  ),
  'B2',
  'the edited latest declaration becomes current'
);

select lives_ok(
  $$
    select public.delete_cefr_level_event(
      (
        select id
        from public.cefr_level_events
        where board_id = '51000000-0000-4000-8000-000000000001'
          and effective_date = date '2024-09-01'
      )
    )
  $$,
  'an owner can delete a level update'
);
select is(
  (
    select level
    from public.cefr_level_events
    where board_id = '51000000-0000-4000-8000-000000000001'
    order by effective_date desc, created_at desc, id desc
    limit 1
  ),
  'B1',
  'deleting the latest update promotes the preceding level'
);

select lives_ok(
  $$
    select public.create_cefr_level_event(
      '51000000-0000-4000-8000-000000000001',
      'A1',
      date '2024-10-01',
      date '2026-07-30'
    )
  $$,
  'a second non-adjacent return can be created for delete validation'
);
select throws_ok(
  $$
    select public.delete_cefr_level_event(
      (
        select id
        from public.cefr_level_events
        where board_id = '51000000-0000-4000-8000-000000000001'
          and effective_date = date '2024-07-01'
      )
    )
  $$,
  '23514',
  'Choose a level different from the current one.',
  'deleting a separating event cannot leave adjacent duplicate levels'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"50000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.cefr_level_events),
  0::bigint,
  'user B cannot read user A CEFR history'
);
select throws_ok(
  $$
    select public.create_cefr_level_event(
      '51000000-0000-4000-8000-000000000001',
      'A0',
      date '2024-01-01',
      date '2026-07-30'
    )
  $$,
  '23514',
  'Level updates require an active owned language board',
  'user B cannot create a level update for user A board'
);
select throws_ok(
  $$
    select public.delete_cefr_level_event(
      '00000000-0000-4000-8000-000000000001'
    )
  $$,
  'P0002',
  'Level update not found',
  'deleting a missing or unowned event is rejected'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"50000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

reset role;

update public.language_boards
set archived_at = statement_timestamp()
where id = '51000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"50000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    select public.create_cefr_level_event(
      '51000000-0000-4000-8000-000000000001',
      'C1',
      date '2025-01-01',
      date '2026-07-30'
    )
  $$,
  '23514',
  'Level updates require an active owned language board',
  'an archived board cannot receive a new level update'
);

reset role;

select * from finish();
rollback;
