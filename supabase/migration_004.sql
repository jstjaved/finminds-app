-- ============================================================
-- FinMinds migration 004 — run in Supabase SQL Editor after migration_003.sql.
-- Fixes: rewards silently not applying (complete_class / claim_daily_bonus),
-- and adds demo students so the leaderboard has something to show at both
-- class (same grade) and school (all grades) scope.
-- ============================================================

-- ---------- Belt-and-suspenders: explicit execute grants ----------
-- RPC functions called via supabase.rpc() go through PostgREST, which needs
-- the calling role to have EXECUTE privilege — unlike direct SQL, this isn't
-- always inherited the way you'd expect. Re-granting is harmless if it was
-- already fine.
grant execute on function complete_class(int, int) to authenticated;
grant execute on function buy_shares(text, int, numeric) to authenticated;
grant execute on function claim_daily_bonus() to authenticated;

-- ---------- Defensive rewrite: make silent no-ops impossible ----------
-- Both functions now verify the UPDATE actually touched a row and raise a
-- clear error if not, instead of quietly succeeding with no effect. If this
-- was actually the bug, you'll now see a real error message in the app if it
-- ever happens again — much easier to diagnose than "nothing happened."
create or replace function complete_class(p_class_id int, p_score int)
returns void as $$
declare
  v_reward int;
  v_already boolean;
  v_rows int;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated — no user id on this session.';
  end if;

  select exists(
    select 1 from class_completions where profile_id = v_uid and class_id = p_class_id
  ) into v_already;

  if v_already then
    return;
  end if;

  select reward_coins into v_reward from classes where id = p_class_id;
  if v_reward is null then
    raise exception 'Unknown class %', p_class_id;
  end if;

  insert into class_completions (profile_id, class_id, score) values (v_uid, p_class_id, p_score);

  update profiles set wallet = wallet + v_reward, investor_xp = investor_xp + 10 where id = v_uid;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Reward update matched no profile row for user %', v_uid;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function claim_daily_bonus()
returns boolean as $$
declare
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_last date;
  v_rows int;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated — no user id on this session.';
  end if;

  select last_daily_bonus_date into v_last from profiles where id = v_uid;
  if v_last is not distinct from v_today then
    return false; -- already claimed today
  end if;

  update profiles set
    wallet = wallet + 500,
    streak = case when v_last = v_today - 1 then streak + 1 else 1 end,
    last_daily_bonus_date = v_today
  where id = v_uid;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Daily bonus update matched no profile row for user %', v_uid;
  end if;
  return true;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function buy_shares(p_company_id text, p_qty int, p_price numeric)
returns void as $$
declare
  v_cost numeric := p_qty * p_price;
  v_wallet int;
  v_rows int;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated — no user id on this session.';
  end if;
  if p_qty <= 0 then
    raise exception 'Quantity must be positive';
  end if;

  select wallet into v_wallet from profiles where id = v_uid;
  if v_wallet is null or v_wallet < v_cost then
    raise exception 'Insufficient balance';
  end if;

  update profiles set wallet = wallet - v_cost, investor_xp = investor_xp + 5 where id = v_uid;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Wallet update matched no profile row for user %', v_uid;
  end if;

  insert into holdings (profile_id, company_id, qty, avg_price)
  values (v_uid, p_company_id, p_qty, p_price)
  on conflict (profile_id, company_id) do update
    set avg_price = ((holdings.avg_price * holdings.qty) + v_cost) / (holdings.qty + p_qty),
        qty = holdings.qty + p_qty;

  insert into transactions (profile_id, company_id, type, qty, price)
  values (v_uid, p_company_id, 'buy', p_qty, p_price);
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================
-- Demo leaderboard data — class (same grade) + school (all grades) scope
-- ============================================================

-- Demo profiles aren't real signed-up students, so they can't satisfy the
-- normal foreign key to auth.users. Dropping that constraint just for this
-- table is a reasonable tradeoff for a demo; real signups still work exactly
-- the same via the handle_new_user trigger.
alter table profiles drop constraint if exists profiles_id_fkey;
alter table profiles add column if not exists is_demo boolean not null default false;
alter table profiles add column if not exists streak int not null default 0;

insert into grades (id, name, sort_order) values (2, 'Grade 5', 2) on conflict (id) do nothing;

insert into profiles (id, name, avatar, grade_id, wallet, investor_xp, streak, is_demo) values
('00000000-0000-0000-0000-000000000001', 'Ananya', '🧑‍🎓', 1, 142000, 55, 4, true),
('00000000-0000-0000-0000-000000000002', 'Rohan', '🦸', 1, 118000, 40, 2, true),
('00000000-0000-0000-0000-000000000003', 'Isha', '🧑‍🔬', 1, 165000, 65, 6, true),
('00000000-0000-0000-0000-000000000004', 'Kabir', '🥷', 1, 105000, 25, 1, true),
('00000000-0000-0000-0000-000000000005', 'Meera', '🧑‍💻', 1, 128000, 45, 3, true),
('00000000-0000-0000-0000-000000000006', 'Advait', '🧑‍🚀', 2, 190000, 80, 9, true),
('00000000-0000-0000-0000-000000000007', 'Zara', '🦸', 2, 175000, 70, 5, true),
('00000000-0000-0000-0000-000000000008', 'Vihaan', '🥷', 2, 152000, 58, 3, true),
('00000000-0000-0000-0000-000000000009', 'Diya', '🧑‍🎓', 2, 138000, 48, 2, true)
on conflict (id) do nothing;
