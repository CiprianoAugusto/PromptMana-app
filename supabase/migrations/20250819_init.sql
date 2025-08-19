-- PromptMana initial schema for Supabase
-- Safe to run on a new project. If you already have tables, review before applying.

begin;

-- UUID generation
create extension if not exists "pgcrypto";

-- =====================
-- TABLE: prompts
-- =====================
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  "promptId" uuid not null,
  title text not null,
  project text not null,
  content text not null,
  version text not null,
  status text not null,
  llm text not null,
  "date" timestamptz not null default now(),
  "parentId" uuid null,
  temperature numeric not null default 0.7 check (temperature >= 0 and temperature <= 2),
  "topP" numeric not null default 0.9 check ("topP" >= 0 and "topP" <= 1),
  effort text not null default 'Medium' check (effort in ('Low','Medium','High')),
  tags text[] not null default '{}',
  comments text,
  constraint prompts_status_chk check (status in ('write','test','edit','use')),
  constraint prompts_parent_fk foreign key ("parentId") references public.prompts(id) on delete set null
);

create index if not exists idx_prompts_promptId on public.prompts ("promptId");
create index if not exists idx_prompts_project on public.prompts (project);
create index if not exists idx_prompts_title on public.prompts (title);
create index if not exists idx_prompts_date on public.prompts ("date");
create index if not exists idx_prompts_parentId on public.prompts ("parentId");

-- =====================
-- TABLE: templates
-- =====================
-- Use text PK to accept both numeric and uuid values originating from the client.
create table if not exists public.templates (
  id text primary key,
  name text not null,
  title text,
  project text,
  content text,
  llm text,
  temperature numeric,
  "topP" numeric,
  effort text,
  "parentId" uuid,
  tags text[]
);

create index if not exists idx_templates_name on public.templates (name);

-- =====================
-- TABLE: input_gallery
-- =====================
create table if not exists public.input_gallery (
  id text primary key,
  name text not null,
  content text not null
);

create index if not exists idx_input_gallery_name on public.input_gallery (name);

-- =====================
-- TABLE: node_flows
-- =====================
-- Upserts rely on a conflict target; we make name the primary key.
create table if not exists public.node_flows (
  name text primary key,
  nodes jsonb not null default '[]'::jsonb,
  connections jsonb not null default '[]'::jsonb
);

-- =====================
-- TABLE: global_lists
-- =====================
create table if not exists public.global_lists (
  name text primary key,
  data jsonb not null default '[]'::jsonb
);

-- =====================
-- RLS (Row Level Security) and Policies
-- These permissive policies allow client-side anon key access.
-- Adjust for your security needs in production.
alter table public.prompts enable row level security;
alter table public.templates enable row level security;
alter table public.input_gallery enable row level security;
alter table public.node_flows enable row level security;
alter table public.global_lists enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'prompts' and policyname = 'prompts_all'
  ) then
    create policy prompts_all on public.prompts for all using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'templates' and policyname = 'templates_all'
  ) then
    create policy templates_all on public.templates for all using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'input_gallery' and policyname = 'input_gallery_all'
  ) then
    create policy input_gallery_all on public.input_gallery for all using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'node_flows' and policyname = 'node_flows_all'
  ) then
    create policy node_flows_all on public.node_flows for all using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'global_lists' and policyname = 'global_lists_all'
  ) then
    create policy global_lists_all on public.global_lists for all using (true) with check (true);
  end if;
end $$;

commit;
