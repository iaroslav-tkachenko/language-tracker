-- Supabase creates this event-trigger helper when automatic RLS is enabled for
-- new public tables. The event trigger does not require Data API roles to call
-- the function directly, so remove the default public EXECUTE privilege.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute
      'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
