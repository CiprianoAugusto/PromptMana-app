-- Adds a dependencies column to prompts as jsonb, default empty array
alter table if exists public.prompts
add column if not exists dependencies jsonb not null default '[]'::jsonb;

-- Optional: backfill from legacy parentId if present and dependencies empty
update public.prompts
set dependencies = jsonb_build_array(parentId)
where (dependencies is null or jsonb_array_length(dependencies) = 0)
  and parentId is not null;
