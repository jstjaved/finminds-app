-- ============================================================
-- FinMinds migration 002 — run this in your EXISTING Supabase
-- project's SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).
-- Safe to run once on top of the original schema.sql; do not re-run schema.sql
-- itself on an existing project (it will fail on duplicate policies).
-- ============================================================

-- ---------- New columns ----------
alter table profiles add column if not exists last_daily_bonus_date date;

alter table classes add column if not exists exercise_prompt text;
alter table classes add column if not exists exercise_options jsonb;
alter table classes add column if not exists exercise_correct_index int;

alter table companies add column if not exists founded_year int;
alter table companies add column if not exists headquarters text;
alter table companies add column if not exists fun_fact text;
alter table companies add column if not exists industry_description text;

-- ---------- Reward economy: signup bonus + flat 10,000/class ----------
-- New signups now start with 1,00,000 coins (1 coin = 1 Rupee).
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, grade_id, wallet)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Student'), 1, 100000);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- One-time retroactive top-up for accounts already created (e.g. your test account)
-- before this migration, so they aren't stuck at 0.
update profiles set wallet = wallet + 100000 where wallet = 0;

-- Every class now pays a flat 10,000 coins on completion.
update classes set reward_coins = 10000;

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
    return;
  end if;

  select reward_coins into v_reward from classes where id = p_class_id;
  if v_reward is null then
    raise exception 'Unknown class %', p_class_id;
  end if;

  insert into class_completions (profile_id, class_id, score) values (auth.uid(), p_class_id, p_score);
  update profiles set wallet = wallet + v_reward, investor_xp = investor_xp + 10 where id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;

-- ---------- Daily sign-in bonus: 500 coins, once per calendar day (IST) ----------
create or replace function claim_daily_bonus()
returns boolean as $$
declare
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_last date;
begin
  select last_daily_bonus_date into v_last from profiles where id = auth.uid();
  if v_last is not distinct from v_today then
    return false; -- already claimed today
  end if;
  update profiles set wallet = wallet + 500, last_daily_bonus_date = v_today where id = auth.uid();
  return true;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------- Expand curriculum: classes 5-10 for Grade 4 ----------
insert into classes (id, grade_id, sort_order, title, video_url, summary, takeaways, reward_coins, is_milestone,
  exercise_prompt, exercise_options, exercise_correct_index) values
(5, 1, 5, 'What is a Bank?', 'REPLACE_WITH_YOUTUBE_ID_5',
  'Banks are safe places to keep money — they also lend it to others and pay you a little extra (interest) for saving with them.',
  '["A bank keeps your money safe.","Banks lend money to others who need it.","Banks pay you interest for saving with them."]', 10000, false,
  'Priya keeps her savings in a piggy bank at home. Meera keeps hers in a real bank account. Whose money is more likely to grow over time?',
  '["Priya''s, because piggy banks are safer","Meera''s, because bank savings can earn interest","Neither, money never grows"]', 1),
(6, 1, 6, 'Needs vs Wants', 'REPLACE_WITH_YOUTUBE_ID_6',
  '"Needs" are things you can''t do without, like food and school supplies. "Wants" are nice-to-haves, like a new game. Knowing the difference helps you spend wisely.',
  '["Needs are things you must have to live and learn.","Wants are nice to have but not essential.","Smart spenders take care of needs before wants."]', 10000, false,
  'You have 200 coins. Your school shoes are worn out (a need) and there''s a cool new toy (a want) for 200 coins. What''s the wiser choice?',
  '["Buy the toy now, shoes can wait","Buy the shoes first, save for the toy later","Buy both and worry later"]', 1),
(7, 1, 7, 'What is a Budget?', 'REPLACE_WITH_YOUTUBE_ID_7',
  'A budget is a simple plan for your money — deciding ahead of time how much you''ll save, spend, and share.',
  '["A budget is a plan for how you''ll use your money.","Budgets help you avoid running out of coins.","Even a simple budget works: save some, spend some."]', 10000, false,
  'You earn 1000 coins a month. Which of these is a budget?',
  '["Spend randomly and see what happens","Decide in advance: 600 save, 300 spend, 100 share","Spend it all on day one"]', 1),
(8, 1, 8, 'What is Interest?', 'REPLACE_WITH_YOUTUBE_ID_8',
  'Interest is extra money added over time — it can work for you when you save, or against you when you borrow.',
  '["Interest is extra money paid for saving, or extra cost for borrowing.","Saved money can grow over time thanks to interest.","Borrowed money can cost more over time thanks to interest."]', 10000, false,
  'If you save 1000 coins and the bank pays interest, next year you''ll have...',
  '["Exactly 1000 coins","Slightly more than 1000 coins","Slightly less than 1000 coins"]', 1),
(9, 1, 9, 'What is Risk?', 'REPLACE_WITH_YOUTUBE_ID_9',
  'Every money choice carries some risk — the chance things don''t go as planned. Investing has more risk than saving, but more potential to grow.',
  '["Risk is the chance an investment could lose value.","Safer choices like savings usually grow slower.","Riskier choices like shares can grow faster — or shrink."]', 10000, false,
  'Which of these is generally SAFER but grows more slowly?',
  '["Keeping money in a savings account","Buying shares in one company","Betting all your coins on one guess"]', 0),
(10, 1, 10, 'Diversification', 'REPLACE_WITH_YOUTUBE_ID_10',
  'Spreading your investment across different companies means one bad day doesn''t wreck your whole portfolio — don''t put all your eggs in one basket.',
  '["Diversification means spreading investments across companies.","If one company does poorly, others may balance it out.","It''s one of the simplest ways to manage investing risk."]', 10000, true,
  'You have 1000 coins to invest. Which is more diversified?',
  '["1000 coins in one company","250 coins each in four different companies","Keeping it all as cash"]', 1)
on conflict (id) do update set
  title = excluded.title, video_url = excluded.video_url, summary = excluded.summary, takeaways = excluded.takeaways,
  reward_coins = excluded.reward_coins, is_milestone = excluded.is_milestone,
  exercise_prompt = excluded.exercise_prompt, exercise_options = excluded.exercise_options, exercise_correct_index = excluded.exercise_correct_index;

-- exercises for the original 4 classes too
update classes set exercise_prompt = 'Aarav found a coin on the street and a friend offered to trade a sticker for it. What is Aarav using to decide if it''s a fair trade?',
  exercise_options = '["Money as a tool for trading value","Nothing, coins have no use","His height"]', exercise_correct_index = 0
  where id = 1;
update classes set exercise_prompt = 'You get 500 coins. You want a toy (300 coins) but you also want to save for a bigger toy next month. What''s a balanced choice?',
  exercise_options = '["Spend all 500 now","Save some, spend some","Save nothing, ever"]', exercise_correct_index = 1
  where id = 2;
update classes set exercise_prompt = 'A group of friends start a lemonade stand together, sharing the work and the earnings. What have they basically created?',
  exercise_options = '["A tiny company","A bank","A quiz"]', exercise_correct_index = 0
  where id = 3;
update classes set exercise_prompt = 'You buy 1 share of a toy company for 100 coins. The company has a great year and grows. What likely happens to your share?',
  exercise_options = '["It becomes worth more","It disappears","It turns into a coupon"]', exercise_correct_index = 0
  where id = 4;

insert into quiz_questions (class_id, sort_order, question, options, correct_index) values
(5, 1, 'What does a bank mainly do with the money people save?', '["Hides it forever","Keeps it safe and lends it to others","Spends it on toys"]', 1),
(5, 2, 'What is "interest"?', '["A fee you pay to enter a bank","Extra money a bank pays you for saving there","A loan you can never repay"]', 1),
(5, 3, 'Why might money in a bank grow over time?', '["Because of interest","Because banks print new money for you","Because piggy banks lose money"]', 0),
(6, 1, 'Which of these is a NEED?', '["Video game","School notebook","Toy car"]', 1),
(6, 2, 'Which of these is a WANT?', '["Drinking water","New sneakers just for style","Medicine"]', 1),
(6, 3, 'Why handle needs before wants?', '["Wants are always cheaper","Needs keep you healthy and prepared first","Needs never matter"]', 1),
(7, 1, 'What is a budget?', '["A type of bank","A plan for how you''ll use your money","A quiz score"]', 1),
(7, 2, 'What''s one benefit of a budget?', '["It guarantees you get rich","It helps you avoid running out of coins","It makes shopping free"]', 1),
(7, 3, 'A simple budget rule could be...', '["Spend everything immediately","Save some, spend some, plan ahead","Never spend anything"]', 1),
(8, 1, 'Interest on your SAVINGS means your money...', '["Shrinks over time","Grows a little over time","Disappears"]', 1),
(8, 2, 'Interest on a LOAN means you...', '["Pay back less than you borrowed","Pay back more than you borrowed","Pay back exactly what you borrowed"]', 1),
(8, 3, 'Why do banks pay interest on savings?', '["Because they use your money and reward you for it","Only because it''s required by law","Because they feel generous randomly"]', 0),
(9, 1, 'What does "risk" mean when investing?', '["A guarantee you''ll get rich","The chance an investment could lose value","A type of coin"]', 1),
(9, 2, 'Which usually carries MORE risk?', '["A savings account","Buying a company''s shares","Coins under your pillow"]', 1),
(9, 3, 'Why do people accept risk when investing?', '["For the chance of higher growth over time","Because risk is required by law","Because it''s always guaranteed"]', 0),
(10, 1, 'What does "diversification" mean?', '["Buying only one company''s shares","Spreading investments across different companies","Never investing at all"]', 1),
(10, 2, 'Why is diversification useful?', '["It guarantees profits","It reduces the impact if one company does poorly","It makes investing free"]', 1),
(10, 3, 'Which is the more diversified portfolio?', '["100% in one company","25% each across four companies","0% invested, 100% cash"]', 1)
on conflict do nothing;

-- ---------- Company enrichment: industry context + fun facts ----------
update companies set founded_year = 1976, headquarters = 'Cupertino, USA', industry_description = 'Consumer technology — designs phones, computers, and wearables.', fun_fact = 'Apple was started in a family garage.' where id = 'aapl';
update companies set founded_year = 1975, headquarters = 'Redmond, USA', industry_description = 'Software & cloud computing — makes operating systems, productivity tools, and games.', fun_fact = 'Microsoft''s first product was a programming language, not Windows.' where id = 'msft';
update companies set founded_year = 1998, headquarters = 'Mountain View, USA', industry_description = 'Internet services — search, video, maps, and advertising.', fun_fact = 'Google started as a research project at Stanford University.' where id = 'goog';
update companies set founded_year = 1994, headquarters = 'Seattle, USA', industry_description = 'E-commerce & cloud computing — online retail plus the servers that power much of the internet.', fun_fact = 'Amazon originally only sold books.' where id = 'amzn';
update companies set founded_year = 2003, headquarters = 'Austin, USA', industry_description = 'Electric vehicles & clean energy.', fun_fact = 'Tesla is named after inventor Nikola Tesla.' where id = 'tsla';
update companies set founded_year = 1964, headquarters = 'Beaverton, USA', industry_description = 'Sportswear & footwear.', fun_fact = 'Nike''s logo, the Swoosh, was designed for just $35.' where id = 'nke';
update companies set founded_year = 1923, headquarters = 'Burbank, USA', industry_description = 'Entertainment — movies, theme parks, and streaming.', fun_fact = 'Disney''s first cartoon star wasn''t Mickey Mouse — it was Oswald the Lucky Rabbit.' where id = 'dis';
update companies set founded_year = 1997, headquarters = 'Los Gatos, USA', industry_description = 'Streaming entertainment.', fun_fact = 'Netflix started as a DVD-by-mail rental company.' where id = 'nflx';
update companies set founded_year = 1938, headquarters = 'Suwon, South Korea', industry_description = 'Consumer electronics — phones, TVs, and chips.', fun_fact = 'Samsung originally began as a small grocery trading company.' where id = 'ssnlf';
update companies set founded_year = 1946, headquarters = 'Tokyo, Japan', industry_description = 'Electronics & entertainment — gaming, cameras, music, and film.', fun_fact = 'Sony''s first product was an electric rice cooker.' where id = 'sony';
update companies set founded_year = 1973, headquarters = 'Mumbai, India', industry_description = 'Conglomerate — energy, retail, and telecom (Jio).', fun_fact = 'Reliance''s Jio helped make mobile data dramatically cheaper across India.' where id = 'rel';
update companies set founded_year = 1968, headquarters = 'Mumbai, India', industry_description = 'IT services — builds software for companies worldwide.', fun_fact = 'TCS is one of the largest IT employers in the world.' where id = 'tcs';
update companies set founded_year = 1981, headquarters = 'Bengaluru, India', industry_description = 'IT services & consulting.', fun_fact = 'Infosys was founded by seven engineers with about $250 in capital.' where id = 'infy';
update companies set founded_year = 1994, headquarters = 'Mumbai, India', industry_description = 'Banking & financial services.', fun_fact = 'HDFC Bank was among the first private banks approved in India after 1994 reforms.' where id = 'hdfc';
update companies set founded_year = 1994, headquarters = 'Mumbai, India', industry_description = 'Banking & financial services.', fun_fact = 'ICICI Bank was one of the earliest Indian banks to offer internet banking.' where id = 'icici';
update companies set founded_year = 1866, headquarters = 'Vevey, Switzerland (India HQ: Gurugram)', industry_description = 'Food & beverages.', fun_fact = 'Maggi noodles launched in India in 1982 and became a household name.' where id = 'nestle';
update companies set founded_year = 1984, headquarters = 'Bengaluru, India', industry_description = 'Watches, jewelry & eyewear.', fun_fact = 'Titan is a joint venture originally started with the Tamil Nadu government.' where id = 'titan';
update companies set founded_year = 1942, headquarters = 'Mumbai, India', industry_description = 'Paints & home décor.', fun_fact = 'Asian Paints has been India''s largest paint company for decades.' where id = 'asianp';
update companies set founded_year = 1945, headquarters = 'Mumbai, India', industry_description = 'Automobiles — cars, trucks, and buses.', fun_fact = 'Tata Motors makes the Nano, once marketed as the world''s cheapest car.' where id = 'tatam';
update companies set founded_year = 1981, headquarters = 'New Delhi, India', industry_description = 'Automobiles — India''s largest carmaker by volume.', fun_fact = 'Maruti 800 was the car that put many Indian families on the road for the first time.' where id = 'maruti';
update companies set founded_year = 1910, headquarters = 'Kolkata, India', industry_description = 'FMCG & consumer goods — food, personal care, and paper.', fun_fact = 'ITC started out focused on tobacco before diversifying widely.' where id = 'itc';
update companies set founded_year = 1892, headquarters = 'Kolkata, India', industry_description = 'Food & biscuits.', fun_fact = 'Britannia has been baking biscuits in India for over 130 years.' where id = 'britannia';
update companies set founded_year = 1945, headquarters = 'Bengaluru, India', industry_description = 'IT services.', fun_fact = 'Wipro began as a vegetable oil company before becoming an IT giant.' where id = 'wipro';
update companies set founded_year = 2015, headquarters = 'Ahmedabad, India', industry_description = 'Renewable energy — solar and wind power.', fun_fact = 'Adani Green operates some of the largest renewable energy parks in the world.' where id = 'adanig';
update companies set founded_year = 2008, headquarters = 'Gurugram, India', industry_description = 'Online food delivery & tech.', fun_fact = 'Zomato started as a simple restaurant menu directory.' where id = 'zomato';
update companies set founded_year = 2010, headquarters = 'Noida, India', industry_description = 'Digital payments & fintech.', fun_fact = 'Paytm popularized QR-code payments across Indian street vendors.' where id = 'paytm';
update companies set founded_year = 1945, headquarters = 'Pune, India', industry_description = 'Automobiles — motorcycles and scooters.', fun_fact = 'Bajaj''s scooters were once one of the most common vehicles on Indian roads.' where id = 'bajaj';
update companies set founded_year = 1933, headquarters = 'Mumbai, India', industry_description = 'FMCG — soaps, detergents, and personal care.', fun_fact = 'HUL is one of India''s oldest and largest consumer goods companies.' where id = 'hul';
update companies set founded_year = 1983, headquarters = 'Mumbai, India', industry_description = 'Pharmaceuticals.', fun_fact = 'Sun Pharma grew from a small operation into one of the world''s largest generic drugmakers.' where id = 'sunpharma';
update companies set founded_year = 1938, headquarters = 'Mumbai, India', industry_description = 'Engineering & construction.', fun_fact = 'L&T has built some of India''s largest infrastructure projects, including metros.' where id = 'lt';
