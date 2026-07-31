-- ============================================================
-- FinMinds MVP schema — run this once in Supabase SQL Editor
-- (Project -> SQL Editor -> New query -> paste -> Run)
-- ============================================================

-- ---------- Curriculum ----------
create table if not exists grades (
  id serial primary key,
  name text not null,
  sort_order int not null
);

create table if not exists classes (
  id serial primary key,
  grade_id int references grades(id) on delete cascade,
  sort_order int not null,
  title text not null,
  video_url text,
  summary text,
  takeaways jsonb not null default '[]',
  reward_coins int not null default 100,
  is_milestone boolean not null default false
);

create table if not exists quiz_questions (
  id serial primary key,
  class_id int references classes(id) on delete cascade,
  sort_order int not null,
  question text not null,
  options jsonb not null,     -- e.g. ["Option A", "Option B", "Option C"]
  correct_index int not null
);

-- ---------- Students ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Student',
  avatar text not null default '🧑‍🚀',
  grade_id int references grades(id),
  wallet int not null default 0,
  investor_xp int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists class_completions (
  id serial primary key,
  profile_id uuid references profiles(id) on delete cascade,
  class_id int references classes(id) on delete cascade,
  score int,
  completed_at timestamptz not null default now(),
  unique (profile_id, class_id)
);

-- ---------- Market ----------
create table if not exists companies (
  id text primary key,
  name text not null,
  sector text not null,
  logo text,
  base_price numeric not null,
  base_chg numeric not null default 0,
  high_52w numeric,
  low_52w numeric,
  real_ticker text,           -- non-null => eligible for live Finnhub price
  story text,
  products jsonb not null default '[]'
);

create table if not exists holdings (
  id serial primary key,
  profile_id uuid references profiles(id) on delete cascade,
  company_id text references companies(id),
  qty int not null,
  avg_price numeric not null,
  unique (profile_id, company_id)
);

create table if not exists transactions (
  id serial primary key,
  profile_id uuid references profiles(id) on delete cascade,
  company_id text references companies(id),
  type text not null,
  qty int not null,
  price numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists watchlist (
  id serial primary key,
  profile_id uuid references profiles(id) on delete cascade,
  company_id text references companies(id),
  unique (profile_id, company_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table class_completions enable row level security;
alter table holdings enable row level security;
alter table transactions enable row level security;
alter table watchlist enable row level security;
alter table grades enable row level security;
alter table classes enable row level security;
alter table quiz_questions enable row level security;
alter table companies enable row level security;

-- Curriculum & market data: readable by any signed-in student.
create policy "read curriculum" on grades for select using (auth.role() = 'authenticated');
create policy "read classes" on classes for select using (auth.role() = 'authenticated');
create policy "read quiz" on quiz_questions for select using (auth.role() = 'authenticated');
create policy "read companies" on companies for select using (auth.role() = 'authenticated');

-- Profiles: everyone signed in can see name/avatar/xp (needed for the leaderboard);
-- only the owner can update, and only non-financial columns (wallet/xp change only via RPC below).
create policy "read all profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "update own profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
revoke update on profiles from authenticated;
grant update (name, avatar, grade_id) on profiles to authenticated;

-- Completions/holdings/transactions: student can read their own rows.
-- No direct INSERT/UPDATE grants — those only happen through the SECURITY DEFINER
-- functions below, so a student can't grant themselves coins or shares from devtools.
create policy "read own completions" on class_completions for select using (auth.uid() = profile_id);
create policy "read own holdings" on holdings for select using (auth.uid() = profile_id);
create policy "read own transactions" on transactions for select using (auth.uid() = profile_id);

-- Watchlist is low-stakes, so the student can manage it directly.
create policy "manage own watchlist" on watchlist for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- ============================================================
-- Auto-create a profile row whenever someone signs up
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, grade_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Student'), 1);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Server-enforced reward: mark a class complete, pay out coins once
-- ============================================================
create or replace function complete_class(p_class_id int, p_score int)
returns void as $$
declare
  v_reward int;
  v_already boolean;
begin
  select exists(
    select 1 from class_completions where profile_id = auth.uid() and class_id = p_class_id
  ) into v_already;

  if v_already then
    return; -- idempotent: no double-dipping on rewards
  end if;

  select reward_coins into v_reward from classes where id = p_class_id;
  if v_reward is null then
    raise exception 'Unknown class %', p_class_id;
  end if;

  insert into class_completions (profile_id, class_id, score) values (auth.uid(), p_class_id, p_score);
  update profiles set wallet = wallet + v_reward, investor_xp = investor_xp + 10 where id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================
-- Server-enforced trade: buy shares, checked against real wallet balance
-- ============================================================
create or replace function buy_shares(p_company_id text, p_qty int, p_price numeric)
returns void as $$
declare
  v_cost numeric := p_qty * p_price;
  v_wallet int;
begin
  if p_qty <= 0 then
    raise exception 'Quantity must be positive';
  end if;

  select wallet into v_wallet from profiles where id = auth.uid();
  if v_wallet is null or v_wallet < v_cost then
    raise exception 'Insufficient balance';
  end if;

  update profiles set wallet = wallet - v_cost, investor_xp = investor_xp + 5 where id = auth.uid();

  insert into holdings (profile_id, company_id, qty, avg_price)
  values (auth.uid(), p_company_id, p_qty, p_price)
  on conflict (profile_id, company_id) do update
    set avg_price = ((holdings.avg_price * holdings.qty) + v_cost) / (holdings.qty + p_qty),
        qty = holdings.qty + p_qty;

  insert into transactions (profile_id, company_id, type, qty, price)
  values (auth.uid(), p_company_id, 'buy', p_qty, p_price);
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================
-- Leaderboard view (safe subset of profiles, ranked)
-- ============================================================
create or replace view leaderboard as
  select id, name, avatar, grade_id, investor_xp, wallet
  from profiles
  order by investor_xp desc;

-- ============================================================
-- MVP seed data: Grade 4, 4 classes, 3 quiz questions each
-- ============================================================
insert into grades (id, name, sort_order) values (1, 'Grade 4', 1)
  on conflict (id) do nothing;

insert into classes (id, grade_id, sort_order, title, video_url, summary, takeaways, reward_coins, is_milestone) values
(1, 1, 1, 'What is Money?', 'REPLACE_WITH_YOUTUBE_ID_1',
  'Money is a tool people invented so trading became easier. Instead of swapping a goat for shoes, you swap a goat for coins — then coins for shoes.',
  '["Money helps us buy things we need and want.","Long ago, people traded goods instead of using coins.","Money only has value because everyone agrees it does."]', 100, false),
(2, 1, 2, 'Saving vs Spending', 'REPLACE_WITH_YOUTUBE_ID_2',
  'Every coin you have can go two places: spent today, or saved for a bigger goal tomorrow. Neither is wrong — but balance matters.',
  '["Spending gets you something now.","Saving grows your options for later.","A little saved often, adds up to a lot."]', 100, false),
(3, 1, 3, 'What is a Company?', 'REPLACE_WITH_YOUTUBE_ID_3',
  'Apple makes iPhones. Nike makes shoes. A company is just an organized way for people to work together and get paid for something useful.',
  '["A company is a group of people making or selling something.","Companies earn money by solving problems for customers.","Bigger, better-run companies usually earn more over time."]', 100, false),
(4, 1, 4, 'What is a Share?', 'REPLACE_WITH_YOUTUBE_ID_4',
  'When you buy a share of a company, you own a tiny piece of it. If the company grows and earns more, that tiny piece can grow in value too.',
  '["A share is a tiny slice of ownership in a company.","If the company does well, your slice can become worth more.","Owning shares makes you a part-owner — not just a customer."]', 500, true)
on conflict (id) do nothing;

insert into quiz_questions (class_id, sort_order, question, options, correct_index) values
(1, 1, 'Why did people start using money?', '["It looks pretty","To make trading easier","Because banks said so"]', 1),
(1, 2, 'Before money, how did people get what they needed?', '["Trading goods directly","Online shopping","Borrowing forever"]', 0),
(1, 3, 'Money has value because...', '["It''s made of gold only","Everyone agrees it''s valuable","It''s very heavy"]', 1),
(2, 1, 'What does saving money do?', '["Makes it disappear","Grows your future options","Nothing at all"]', 1),
(2, 2, 'Spending money gets you...', '["Something right now","Nothing ever","Only regret"]', 0),
(2, 3, 'A smart money habit is to...', '["Spend everything instantly","Save a little regularly","Never spend at all"]', 1),
(3, 1, 'What is a company?', '["A random building","People working together to sell something useful","A type of coin"]', 1),
(3, 2, 'How do companies usually earn money?', '["Solving problems for customers","Doing nothing","Hiding from customers"]', 0),
(3, 3, 'Apple is a company that mainly makes...', '["Farming tools","Phones & computers","Snacks"]', 1),
(4, 1, 'What is a share?', '["A company''s logo","A tiny piece of ownership in a company","A type of loan"]', 1),
(4, 2, 'If a company grows and does well, your share can...', '["Disappear","Become worth more","Turn into a coupon"]', 1),
(4, 3, 'Owning a share makes you a...', '["Customer only","Part-owner of the company","Employee automatically"]', 1)
on conflict do nothing;

insert into companies (id, name, sector, logo, base_price, base_chg, high_52w, low_52w, real_ticker, story, products) values
('aapl','Apple','Tech','🍎',182,1.4,201,148,'AAPL','Apple makes iPhones, iPads, MacBooks and Watches. Millions of people use Apple products every day.', '["iPhone","MacBook","Watch"]'),
('msft','Microsoft','Tech','🪟',210,0.8,228,175,'MSFT','Microsoft builds Windows, Office, and Xbox — used in schools and offices everywhere.', '["Windows","Xbox","Office"]'),
('goog','Google','Tech','🔍',156,-0.6,168,122,'GOOGL','Google helps billions of people search the internet, watch YouTube, and find their way with Maps.', '["Search","YouTube","Maps"]'),
('amzn','Amazon','Retail','📦',143,2.1,160,118,'AMZN','Amazon delivers packages to doorsteps everywhere and streams shows through Prime Video.', '["Prime","Alexa","AWS"]'),
('tsla','Tesla','Auto','⚡',245,-1.8,299,190,'TSLA','Tesla builds electric cars, plus solar panels and batteries for homes.', '["Model 3","Powerwall"]'),
('nke','Nike','Retail','👟',88,0.5,102,76,'NKE','Nike designs sneakers and sportswear worn on every playground in the world.', '["Air Max","Jordans"]'),
('dis','Disney','Retail','🏰',96,1.1,112,80,'DIS','Disney makes the movies, shows, and theme parks behind your favorite characters.', '["Disney+","Theme Parks"]'),
('nflx','Netflix','Retail','🎬',610,3.2,690,470,'NFLX','Netflix streams movies and shows to homes everywhere.', '["Streaming"]'),
('ssnlf','Samsung','Tech','📱',74,0.3,82,61,'SSNLF','Samsung makes phones, TVs, and the screens inside many other gadgets.', '["Galaxy","TVs"]'),
('sony','Sony','Tech','🎮',91,-0.4,98,75,'SONY','Sony makes PlayStation consoles, cameras, and produces music and movies.', '["PlayStation"]'),
('rel','Reliance','Energy','🛢️',128,0.9,140,108,null,'Reliance is one of India''s biggest companies — energy, retail stores, and Jio mobile.', '["Jio","Retail"]'),
('tcs','TCS','Tech','💻',385,1.6,410,320,null,'TCS builds software and technology systems for huge companies worldwide.', '["IT Services"]'),
('infy','Infosys','Tech','🖥️',172,0.7,190,145,null,'Infosys helps businesses everywhere go digital.', '["IT Services"]'),
('hdfc','HDFC Bank','Banking','🏦',164,0.4,175,140,null,'HDFC Bank helps millions of people in India save money and get loans.', '["Savings","Loans"]'),
('icici','ICICI Bank','Banking','🏛️',118,-0.2,128,98,null,'ICICI Bank is one of India''s largest banks.', '["Banking"]'),
('nestle','Nestlé India','FMCG','🍫',248,0.6,265,210,null,'Nestlé makes Maggi noodles, KitKat, and Milkmaid.', '["Maggi","KitKat"]'),
('titan','Titan','Retail','⌚',342,1.9,370,280,null,'Titan makes watches and jewelry, including Fastrack.', '["Fastrack","Tanishq"]'),
('asianp','Asian Paints','Materials','🎨',296,-0.7,320,250,null,'Asian Paints colors homes across India.', '["Wall Paint"]'),
('tatam','Tata Motors','Auto','🚗',102,1.3,118,82,null,'Tata Motors builds cars, trucks, and buses across India.', '["Cars","Trucks"]'),
('maruti','Maruti Suzuki','Auto','🚙',356,0.5,380,300,null,'Maruti Suzuki makes some of India''s most common family cars.', '["Swift","Baleno"]'),
('itc','ITC','FMCG','🍪',87,0.2,95,74,null,'ITC makes snacks and everyday household products.', '["Sunfeast","Aashirvaad"]'),
('britannia','Britannia','FMCG','🍩',214,-0.3,230,185,null,'Britannia bakes Good Day and Marie Gold biscuits.', '["Good Day"]'),
('wipro','Wipro','Tech','🧑‍💻',96,0.9,105,80,null,'Wipro builds technology systems for companies around the globe.', '["IT Services"]'),
('adanig','Adani Green','Materials','🌱',133,2.4,155,95,null,'Adani Green builds solar and wind farms.', '["Solar Farms"]'),
('zomato','Zomato','Tech','🍽️',42,3.6,52,28,null,'Zomato brings your favorite restaurant food to your door.', '["Food Delivery"]'),
('paytm','Paytm','Tech','💳',58,-1.1,71,44,null,'Paytm lets people pay for things with just their phone.', '["Mobile Payments"]'),
('bajaj','Bajaj Auto','Auto','🏍️',178,0.6,195,150,null,'Bajaj Auto makes motorcycles and scooters across India.', '["Pulsar"]'),
('hul','Hindustan Unilever','FMCG','🧴',259,0.4,275,225,null,'HUL makes soap, shampoo, and everyday products.', '["Lux","Dove"]'),
('sunpharma','Sun Pharma','Pharma','💊',121,0.3,132,100,null,'Sun Pharma makes medicines that help people stay healthy.', '["Medicines"]'),
('lt','L&T','Materials','🏗️',331,1.0,350,270,null,'L&T builds bridges, metros, and buildings across India.', '["Construction"]')
on conflict (id) do nothing;
