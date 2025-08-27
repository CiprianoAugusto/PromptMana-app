-- Align prompts.status check constraint with UI statuses
-- UI uses: idea, write, test, ready, archive
-- Backfill legacy values: edit -> write, use -> ready; then enforce new set

begin;

-- 1) Backfill legacy status values if table/column exist
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='prompts' and column_name='status'
  ) then
  update public.prompts set status = 'write' where status = 'edit';
  update public.prompts set status = 'ready' where status = 'use';
  end if;
end $$;

-- 2) Drop old constraint if present and recreate with canonical set
do $$ begin
  if exists (
    select 1 from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where c.conname = 'prompts_status_chk' and n.nspname = 'public' and t.relname = 'prompts'
  ) then
    alter table public.prompts drop constraint prompts_status_chk;
  end if;
end $$;

alter table if exists public.prompts
  add constraint prompts_status_chk check (status in ('idea','write','test','ready','archive'));

commit;
