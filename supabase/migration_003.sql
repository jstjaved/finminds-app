-- ============================================================
-- FinMinds migration 003 — run in Supabase SQL Editor after migration_002.sql.
-- Supports the desktop redesign: richer company fundamentals (CEO, revenue
-- model, PE/PB/ROCE/dividend yield, market cap) and 10 more Indian companies,
-- since the app is moving to a fully-simulated Indian-only market (no more
-- Finnhub/US tickers — see README for why).
-- ============================================================

alter table companies add column if not exists ceo text;
alter table companies add column if not exists revenue_model text;
alter table companies add column if not exists pe_ratio numeric;
alter table companies add column if not exists pb_ratio numeric;
alter table companies add column if not exists roce numeric;
alter table companies add column if not exists dividend_yield numeric;
alter table companies add column if not exists market_cap_cr numeric; -- in ₹ Crore, illustrative

-- ---------- 10 additional Indian companies ----------
insert into companies (id, name, sector, logo, base_price, base_chg, high_52w, low_52w, real_ticker, story, products,
  founded_year, headquarters, industry_description, fun_fact) values
('sbi', 'State Bank of India', 'Banking', '🏦', 812, 0.6, 912, 690, null,
  'SBI is India''s largest bank, with branches reaching towns and villages across the whole country.', '["Savings Accounts","Home Loans"]',
  1955, 'Mumbai, India', 'Banking & financial services.', 'SBI traces its roots back over 200 years to the Bank of Calcutta.'),
('airtel', 'Bharti Airtel', 'Tech', '📶', 1642, 1.2, 1780, 1280, null,
  'Airtel connects hundreds of millions of Indians with mobile networks, broadband, and DTH TV.', '["Mobile Network","Broadband"]',
  1995, 'New Delhi, India', 'Telecommunications.', 'Airtel operates in more than a dozen countries across Asia and Africa.'),
('kotak', 'Kotak Mahindra Bank', 'Banking', '🏛️', 1780, -0.3, 1950, 1520, null,
  'Kotak Mahindra Bank offers savings, loans, and investment services to millions of Indian customers.', '["Banking","Investments"]',
  1985, 'Mumbai, India', 'Banking & financial services.', 'Kotak started as a financial services company before becoming a full bank in 2003.'),
('adanient', 'Adani Enterprises', 'Materials', '🏗️', 2450, 1.8, 2680, 2010, null,
  'Adani Enterprises is the founding company of the Adani Group, building ports, airports, and infrastructure.', '["Infrastructure","Logistics"]',
  1988, 'Ahmedabad, India', 'Diversified infrastructure & incubator for new Adani businesses.', 'Adani Enterprises began as a commodity trading company.'),
('coalindia', 'Coal India', 'Energy', '⛏️', 412, -0.5, 480, 360, null,
  'Coal India is the world''s largest coal-mining company, supplying most of India''s coal for electricity.', '["Coal Mining"]',
  1975, 'Kolkata, India', 'Mining & energy.', 'Coal India produces more coal than almost any other single company on Earth.'),
('ongc', 'ONGC', 'Energy', '🛢️', 258, 0.4, 300, 220, null,
  'ONGC explores and produces oil and natural gas from fields across India.', '["Oil & Gas"]',
  1956, 'Dehradun, India', 'Oil & gas exploration.', 'ONGC produces the majority of India''s domestic crude oil.'),
('dmart', 'Avenue Supermarts (DMart)', 'Retail', '🛒', 3980, 2.1, 4350, 3400, null,
  'DMart runs a popular chain of supermarkets across India known for low prices on everyday goods.', '["Groceries","Household Goods"]',
  2002, 'Mumbai, India', 'Retail & supermarkets.', 'DMart is known for owning most of its store buildings instead of renting them.'),
('hcltech', 'HCL Technologies', 'Tech', '💻', 1720, 0.9, 1890, 1450, null,
  'HCL Technologies builds software and IT systems for companies around the world.', '["IT Services"]',
  1976, 'Noida, India', 'IT services & consulting.', 'HCL started out building some of India''s earliest computers.'),
('bajajfinance', 'Bajaj Finance', 'Banking', '💰', 6890, -0.7, 7600, 5900, null,
  'Bajaj Finance lends money for everything from phones to homes, and is one of India''s largest lenders outside traditional banks.', '["Consumer Loans","EMI Cards"]',
  1987, 'Pune, India', 'Non-banking financial services (lending).', 'Bajaj Finance popularized "no-cost EMI" shopping in India.'),
('ultratech', 'UltraTech Cement', 'Materials', '🧱', 10850, 1.1, 11800, 9200, null,
  'UltraTech makes the cement used to build homes, roads, and bridges across India.', '["Cement","Concrete"]',
  1983, 'Mumbai, India', 'Cement & building materials.', 'UltraTech is one of the largest cement makers outside China.')
on conflict (id) do nothing;

-- ---------- CEO field: populated only where confidently accurate & stable, else left blank ----------
-- (left null elsewhere on purpose — better to omit than risk a stale/incorrect name; the UI
-- only renders this field when present.)
update companies set ceo = 'Mukesh Ambani (Chairman & MD)' where id = 'rel';
update companies set ceo = 'Gautam Adani (Chairman)' where id in ('adanig', 'adanient');
update companies set ceo = 'Rajiv Bajaj (MD)' where id = 'bajaj';
update companies set ceo = 'C. S. Setty (Chairman)' where id = 'sbi';

-- ---------- Revenue model: short educational description for every company ----------
update companies set revenue_model = 'Sells energy products and earns from retail stores and Jio mobile/broadband subscriptions.' where id = 'rel';
update companies set revenue_model = 'Charges client companies for building and maintaining their software systems.' where id = 'tcs';
update companies set revenue_model = 'Charges client companies for IT consulting and building digital systems.' where id = 'infy';
update companies set revenue_model = 'Earns interest on loans and fees on banking services.' where id in ('hdfc','icici','sbi','kotak');
update companies set revenue_model = 'Sells food and beverage products through shops and supermarkets worldwide.' where id = 'nestle';
update companies set revenue_model = 'Sells watches, jewelry, and eyewear through its own stores.' where id = 'titan';
update companies set revenue_model = 'Sells paint and home-decor products to builders, painters, and homeowners.' where id = 'asianp';
update companies set revenue_model = 'Sells cars, trucks, and buses to individual and business customers.' where id in ('tatam','maruti','bajaj');
update companies set revenue_model = 'Sells packaged food, cigarettes, and household products through retail stores.' where id = 'itc';
update companies set revenue_model = 'Sells packaged biscuits and snacks through retail stores.' where id = 'britannia';
update companies set revenue_model = 'Charges client companies for IT consulting and outsourcing services.' where id in ('wipro','hcltech');
update companies set revenue_model = 'Sells electricity generated from solar and wind power plants.' where id = 'adanig';
update companies set revenue_model = 'Earns a commission on every food order placed through its app.' where id = 'zomato';
update companies set revenue_model = 'Earns fees from digital payment transactions and financial services.' where id = 'paytm';
update companies set revenue_model = 'Sells soap, shampoo, and household products through retail stores.' where id = 'hul';
update companies set revenue_model = 'Sells medicines to hospitals, pharmacies, and patients worldwide.' where id = 'sunpharma';
update companies set revenue_model = 'Gets paid to design and build large infrastructure and construction projects.' where id = 'lt';
update companies set revenue_model = 'Charges customers monthly for mobile, broadband, and TV services.' where id = 'airtel';
update companies set revenue_model = 'Builds and operates ports, airports, and other large infrastructure, earning usage fees.' where id = 'adanient';
update companies set revenue_model = 'Sells coal to power plants and factories across India.' where id = 'coalindia';
update companies set revenue_model = 'Sells crude oil and natural gas extracted from Indian oil fields.' where id = 'ongc';
update companies set revenue_model = 'Sells groceries and household goods through its supermarket chain.' where id = 'dmart';
update companies set revenue_model = 'Lends money to individuals and businesses and earns interest on loans.' where id = 'bajajfinance';
update companies set revenue_model = 'Sells cement to builders and construction companies across India.' where id = 'ultratech';

-- ---------- Illustrative fundamentals (PE, PB, ROCE, dividend yield, market cap) ----------
-- These are teaching approximations, not live financial data — the UI labels them "illustrative".
update companies set pe_ratio=10.5, pb_ratio=1.5, roce=8.6, dividend_yield=2.14, market_cap_cr=71188 where id='rel';
update companies set pe_ratio=31.1, pb_ratio=8.5, roce=27.4, dividend_yield=1.06, market_cap_cr=198790 where id='tcs';
update companies set pe_ratio=28.1, pb_ratio=10.0, roce=21.7, dividend_yield=0.29, market_cap_cr=721918 where id='infy';
update companies set pe_ratio=17.8, pb_ratio=3.0, roce=15.8, dividend_yield=0.74, market_cap_cr=848765 where id='hdfc';
update companies set pe_ratio=10.3, pb_ratio=3.8, roce=13.5, dividend_yield=1.65, market_cap_cr=401633 where id='icici';
update companies set pe_ratio=42.9, pb_ratio=12.3, roce=35.7, dividend_yield=1.38, market_cap_cr=1687280 where id='nestle';
update companies set pe_ratio=41.8, pb_ratio=12.1, roce=15.4, dividend_yield=0.29, market_cap_cr=1505438 where id='titan';
update companies set pe_ratio=12.5, pb_ratio=3.0, roce=18.3, dividend_yield=1.32, market_cap_cr=229929 where id='asianp';
update companies set pe_ratio=17.6, pb_ratio=3.1, roce=14.6, dividend_yield=0.67, market_cap_cr=395318 where id='tatam';
update companies set pe_ratio=29.3, pb_ratio=3.5, roce=13.5, dividend_yield=0.62, market_cap_cr=1351437 where id='maruti';
update companies set pe_ratio=36.9, pb_ratio=19.9, roce=28.8, dividend_yield=1.50, market_cap_cr=716176 where id='itc';
update companies set pe_ratio=57.8, pb_ratio=17.6, roce=33.6, dividend_yield=1.42, market_cap_cr=26120 where id='britannia';
update companies set pe_ratio=35.0, pb_ratio=10.4, roce=25.0, dividend_yield=0.21, market_cap_cr=943100 where id='wipro';
update companies set pe_ratio=12.1, pb_ratio=6.3, roce=21.8, dividend_yield=0.74, market_cap_cr=727655 where id='adanig';
update companies set pe_ratio=26.4, pb_ratio=6.8, roce=22.9, dividend_yield=0.31, market_cap_cr=523916 where id='zomato';
update companies set pe_ratio=35.1, pb_ratio=8.6, roce=24.5, dividend_yield=0.39, market_cap_cr=849076 where id='paytm';
update companies set pe_ratio=15.7, pb_ratio=3.1, roce=13.4, dividend_yield=1.22, market_cap_cr=1549082 where id='bajaj';
update companies set pe_ratio=53.1, pb_ratio=11.3, roce=30.8, dividend_yield=1.53, market_cap_cr=1515297 where id='hul';
update companies set pe_ratio=21.2, pb_ratio=4.5, roce=16.1, dividend_yield=1.00, market_cap_cr=1683197 where id='sunpharma';
update companies set pe_ratio=17.5, pb_ratio=6.1, roce=20.3, dividend_yield=1.31, market_cap_cr=1492716 where id='lt';
update companies set pe_ratio=17.3, pb_ratio=3.4, roce=15.2, dividend_yield=1.65, market_cap_cr=571669 where id='sbi';
update companies set pe_ratio=27.1, pb_ratio=5.2, roce=23.4, dividend_yield=0.72, market_cap_cr=1185470 where id='airtel';
update companies set pe_ratio=19.3, pb_ratio=2.9, roce=17.0, dividend_yield=0.92, market_cap_cr=1473044 where id='kotak';
update companies set pe_ratio=18.0, pb_ratio=6.3, roce=13.4, dividend_yield=0.75, market_cap_cr=782482 where id='adanient';
update companies set pe_ratio=12.9, pb_ratio=2.1, roce=14.5, dividend_yield=3.91, market_cap_cr=10151 where id='coalindia';
update companies set pe_ratio=9.7, pb_ratio=1.2, roce=15.7, dividend_yield=4.74, market_cap_cr=317605 where id='ongc';
update companies set pe_ratio=45.5, pb_ratio=14.6, roce=20.0, dividend_yield=0.51, market_cap_cr=1370079 where id='dmart';
update companies set pe_ratio=36.6, pb_ratio=9.1, roce=28.1, dividend_yield=0.47, market_cap_cr=1189934 where id='hcltech';
update companies set pe_ratio=10.4, pb_ratio=3.9, roce=12.6, dividend_yield=1.42, market_cap_cr=1123914 where id='bajajfinance';
update companies set pe_ratio=24.9, pb_ratio=3.7, roce=18.1, dividend_yield=0.92, market_cap_cr=1528401 where id='ultratech';

-- ---------- Remove the 10 US companies (Apple, Microsoft, etc.) — Indian-only market now ----------
-- Only deletes them if no student has ever held or transacted them, so nobody's real
-- portfolio history disappears. If any of the 10 do have holdings/transactions on
-- your instance, they're left in place (just no longer shown in new searches you'd
-- run against the app) rather than silently deleting a student's data.
delete from companies
where id in ('aapl','msft','goog','amzn','tsla','nke','dis','nflx','ssnlf','sony')
  and id not in (select company_id from holdings)
  and id not in (select company_id from transactions)
  and id not in (select company_id from watchlist);
