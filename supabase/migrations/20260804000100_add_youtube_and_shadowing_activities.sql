alter table public.activity_types
drop constraint activity_types_system_key_valid;

alter table public.activity_types
add constraint activity_types_system_key_valid check (
  system_key is null
  or system_key in (
    'reading',
    'podcast',
    'speaking',
    'writing',
    'anki',
    'grammar',
    'tv_show_film',
    'youtube',
    'shadowing'
  )
);

update public.activity_types
set system_key = 'youtube'
where system_key is null
  and lower(name) = 'youtube'
  and not exists (
    select 1
    from public.activity_types existing
    where existing.user_id = activity_types.user_id
      and existing.system_key = 'youtube'
  );

update public.activity_types
set system_key = 'shadowing'
where system_key is null
  and lower(name) = 'shadowing'
  and not exists (
    select 1
    from public.activity_types existing
    where existing.user_id = activity_types.user_id
      and existing.system_key = 'shadowing'
  );

insert into public.activity_types (user_id, name, system_key, position)
select
  profile.user_id,
  'YouTube',
  'youtube',
  coalesce((
    select max(activity.position) + 1
    from public.activity_types activity
    where activity.user_id = profile.user_id
      and activity.archived_at is null
  ), 0)
from public.profiles profile
where not exists (
  select 1
  from public.activity_types activity
  where activity.user_id = profile.user_id
    and activity.system_key = 'youtube'
)
and not exists (
  select 1
  from public.activity_types activity
  where activity.user_id = profile.user_id
    and lower(activity.name) = 'youtube'
)
and (
  select count(*)
  from public.activity_types activity
  where activity.user_id = profile.user_id
    and activity.archived_at is null
) < 30;

insert into public.activity_types (user_id, name, system_key, position)
select
  profile.user_id,
  'Shadowing',
  'shadowing',
  coalesce((
    select max(activity.position) + 1
    from public.activity_types activity
    where activity.user_id = profile.user_id
      and activity.archived_at is null
  ), 0)
from public.profiles profile
where not exists (
  select 1
  from public.activity_types activity
  where activity.user_id = profile.user_id
    and activity.system_key = 'shadowing'
)
and not exists (
  select 1
  from public.activity_types activity
  where activity.user_id = profile.user_id
    and lower(activity.name) = 'shadowing'
)
and (
  select count(*)
  from public.activity_types activity
  where activity.user_id = profile.user_id
    and activity.archived_at is null
) < 30;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.activity_types (user_id, name, system_key, position)
  values
    (new.id, 'Reading', 'reading', 0),
    (new.id, 'Podcast', 'podcast', 1),
    (new.id, 'Speaking', 'speaking', 2),
    (new.id, 'Writing', 'writing', 3),
    (new.id, 'Anki', 'anki', 4),
    (new.id, 'Grammar', 'grammar', 5),
    (new.id, 'TV Show / Film', 'tv_show_film', 6),
    (new.id, 'YouTube', 'youtube', 7),
    (new.id, 'Shadowing', 'shadowing', 8)
  on conflict (user_id, system_key) do nothing;

  return new;
end;
$$;
