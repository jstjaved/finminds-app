-- ============================================================
-- FinMinds migration 005 — run in Supabase SQL Editor after migration_004.sql.
-- Adds: sell_shares RPC (there was no way to sell before), and updates every
-- company's base_price/52w range to roughly today's real NSE price, since the
-- old placeholder numbers were far too low for several stocks.
-- ============================================================

-- ---------- Sell shares: server-enforced, mirrors buy_shares ----------
create or replace function sell_shares(p_company_id text, p_qty int, p_price numeric)
returns void as $$
declare
  v_proceeds numeric := p_qty * p_price;
  v_held int;
  v_rows int;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated — no user id on this session.';
  end if;
  if p_qty <= 0 then
    raise exception 'Quantity must be positive';
  end if;

  select qty into v_held from holdings where profile_id = v_uid and company_id = p_company_id;
  if v_held is null or v_held < p_qty then
    raise exception 'You do not own enough shares to sell that many';
  end if;

  if v_held = p_qty then
    delete from holdings where profile_id = v_uid and company_id = p_company_id;
  else
    update holdings set qty = qty - p_qty where profile_id = v_uid and company_id = p_company_id;
  end if;

  update profiles set wallet = wallet + v_proceeds where id = v_uid;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Wallet update matched no profile row for user %', v_uid;
  end if;

  insert into transactions (profile_id, company_id, type, qty, price)
  values (v_uid, p_company_id, 'sell', p_qty, p_price);
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function sell_shares(text, int, numeric) to authenticated;

-- ============================================================
-- Realistic current-anchored prices (approximate, based on recent NSE
-- prices as of mid-2026 — not a live feed, so these will drift out of date;
-- update periodically if exact accuracy matters). 52-week range set to
-- roughly +/-18% around the new base price to stay proportional.
-- ============================================================

-- Capture old prices first so we can rescale any existing holdings'
-- avg_price proportionally — without this, anyone who already bought shares
-- at the old placeholder prices would show a fake windfall/loss the moment
-- this migration runs, purely from the repricing rather than anything they
-- actually experienced.
create temporary table old_prices as select id, base_price from companies;

update companies set base_price=1300, high_52w=1612, low_52w=1253 where id='rel';
update companies set base_price=2430, high_52w=2790, low_52w=2050 where id='tcs';
update companies set base_price=1155, high_52w=1450, low_52w=1030 where id='infy';
update companies set base_price=750,  high_52w=900,  low_52w=650  where id='hdfc';
update companies set base_price=1435, high_52w=1600, low_52w=1180 where id='icici';
update companies set base_price=1200, high_52w=1400, low_52w=1000 where id='nestle';
update companies set base_price=3400, high_52w=3950, low_52w=2900 where id='titan';
update companies set base_price=2500, high_52w=2900, low_52w=2150 where id='asianp';
update companies set base_price=390,  high_52w=509,  low_52w=306  where id='tatam';
update companies set base_price=12500,high_52w=14200,low_52w=10800 where id='maruti';
update companies set base_price=430,  high_52w=500,  low_52w=370  where id='itc';
update companies set base_price=5500, high_52w=6200, low_52w=4700 where id='britannia';
update companies set base_price=186,  high_52w=230,  low_52w=150  where id='wipro';
update companies set base_price=1000, high_52w=1250, low_52w=800  where id='adanig';
update companies set base_price=260,  high_52w=320,  low_52w=200  where id='zomato';
update companies set base_price=900,  high_52w=1100, low_52w=700  where id='paytm';
update companies set base_price=9000, high_52w=10200,low_52w=7600 where id='bajaj';
update companies set base_price=2400, high_52w=2750, low_52w=2050 where id='hul';
update companies set base_price=1750, high_52w=2000, low_52w=1500 where id='sunpharma';
update companies set base_price=3938, high_52w=4400, low_52w=3300 where id='lt';
update companies set base_price=1025, high_52w=1200, low_52w=850  where id='sbi';
update companies set base_price=1900, high_52w=2150, low_52w=1600 where id='airtel';
update companies set base_price=390,  high_52w=450,  low_52w=330  where id='kotak';
update companies set base_price=2500, high_52w=2900, low_52w=2100 where id='adanient';
update companies set base_price=400,  high_52w=460,  low_52w=340  where id='coalindia';
update companies set base_price=250,  high_52w=300,  low_52w=210  where id='ongc';
update companies set base_price=3800, high_52w=4400, low_52w=3200 where id='dmart';
update companies set base_price=1750, high_52w=2000, low_52w=1500 where id='hcltech';
update companies set base_price=900,  high_52w=1050, low_52w=750  where id='bajajfinance';
update companies set base_price=11500,high_52w=13000,low_52w=9800 where id='ultratech';

-- Rescale existing holdings' cost basis by the same ratio as their
-- company's price change, so P&L stays meaningful instead of jumping
-- purely from this repricing.
update holdings h
set avg_price = h.avg_price * (c.base_price / op.base_price)
from companies c, old_prices op
where h.company_id = c.id and h.company_id = op.id and op.base_price > 0;
