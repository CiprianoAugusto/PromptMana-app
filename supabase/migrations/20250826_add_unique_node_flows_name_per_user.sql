-- Enforce unique flow name per user and deduplicate existing rows
begin;

-- Backfill: ensure user_id exists (safety; already added in previous migrations)
alter table public.node_flows add column if not exists user_id uuid;
create index if not exists idx_node_flows_user_id on public.node_flows(user_id);

-- Deduplicate by keeping the latest row per (user_id, name)
with ranked as (
  select ctid, name, user_id,
         row_number() over(partition by user_id, name order by (to_timestamp(0))) as rn
  from public.node_flows
)
delete from public.node_flows nf
using ranked r
where nf.ctid = r.ctid and r.rn > 1;

-- Add the unique constraint
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'uq_node_flows_user_name'
  ) then
    alter table public.node_flows
      add constraint uq_node_flows_user_name unique (user_id, name);
  end if;
end $$;

commit;
