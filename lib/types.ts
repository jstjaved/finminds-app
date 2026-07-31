export type Profile = {
  id: string;
  name: string;
  avatar: string;
  grade_id: number | null;
  wallet: number;
  investor_xp: number;
  last_daily_bonus_date?: string | null;
  streak?: number;
};

export type ClassRow = {
  id: number;
  grade_id: number;
  sort_order: number;
  title: string;
  video_url: string | null;
  summary: string | null;
  takeaways: string[];
  reward_coins: number;
  is_milestone: boolean;
  exercise_prompt?: string | null;
  exercise_options?: string[] | null;
  exercise_correct_index?: number | null;
};

export type QuizQuestion = {
  id: number;
  class_id: number;
  sort_order: number;
  question: string;
  options: string[];
  correct_index: number;
};

export type Company = {
  id: string;
  name: string;
  sector: string;
  logo: string;
  base_price: number;
  base_chg: number;
  high_52w: number;
  low_52w: number;
  real_ticker: string | null;
  story: string;
  products: string[];
  founded_year?: number | null;
  headquarters?: string | null;
  fun_fact?: string | null;
  industry_description?: string | null;
  ceo?: string | null;
  revenue_model?: string | null;
  pe_ratio?: number | null;
  pb_ratio?: number | null;
  roce?: number | null;
  dividend_yield?: number | null;
  market_cap_cr?: number | null;
};

export type Holding = {
  id: number;
  profile_id: string;
  company_id: string;
  qty: number;
  avg_price: number;
};

export type Transaction = {
  id: number;
  company_id: string;
  type: string;
  qty: number;
  price: number;
  created_at: string;
};

export type LiveQuote = { price: number; chg: number; live: boolean };
