-- ══════════════════════════════════════════════════════════════
--  Gravity Expense Tracker — Supabase Schema
--  Run this entire file in the Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- ── 1. ENABLE UUID extension (already on by default in Supabase) ──
create extension if not exists "pgcrypto";

-- ── 2. EXPENSES TABLE ────────────────────────────────────────────
create table if not exists public.expenses (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null    default now(),
  user_id     uuid        not null    references auth.users (id) on delete cascade,
  title       text        not null,
  amount      numeric(12, 2) not null check (amount > 0),
  category    text        not null    check (category in ('Food','Travel','Bills','Fun')),
  date        date        not null    default current_date
);

-- ── 3. INDEXES for fast per-user queries ────────────────────────
create index if not exists expenses_user_id_idx  on public.expenses (user_id);
create index if not exists expenses_date_idx     on public.expenses (date desc);
create index if not exists expenses_category_idx on public.expenses (category);

-- ── 4. ROW LEVEL SECURITY ────────────────────────────────────────
alter table public.expenses enable row level security;

-- Users can SELECT only their own rows
create policy "Users can view own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

-- Users can INSERT only rows where user_id = their uid
create policy "Users can insert own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

-- Users can UPDATE only their own rows
create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can DELETE only their own rows
create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- ── 5. RPC: get_category_totals ──────────────────────────────────
--  Returns: [{ category, total }]  — filtered by the calling user
--  Optional params:
--    p_from  date  (inclusive) — default: start of current month
--    p_to    date  (inclusive) — default: today
create or replace function public.get_category_totals(
  p_from date default date_trunc('month', current_date)::date,
  p_to   date default current_date
)
returns table (category text, total numeric)
language sql
security definer        -- runs as the function owner, but RLS still applies
stable
as $$
  select
    e.category,
    sum(e.amount) as total
  from public.expenses e
  where
    e.user_id = auth.uid()
    and e.date between p_from and p_to
  group by e.category
  order by total desc;
$$;

-- ── 6. RPC: get_monthly_summary ──────────────────────────────────
--  Returns: { total_spent, tx_count, avg_per_day }  for current month
create or replace function public.get_monthly_summary()
returns json
language sql
security definer
stable
as $$
  select json_build_object(
    'total_spent', coalesce(sum(amount), 0),
    'tx_count',    count(*),
    'avg_per_day', coalesce(
      sum(amount) / nullif(extract(day from current_date)::int, 0),
      0
    )
  )
  from public.expenses
  where
    user_id = auth.uid()
    and date_trunc('month', date) = date_trunc('month', current_date);
$$;

-- ── 7. Grant execute on RPCs to authenticated role ───────────────
grant execute on function public.get_category_totals  to authenticated;
grant execute on function public.get_monthly_summary  to authenticated;
