// Since the market is fully simulated (no live feed), prices need to actually
// move for P&L to mean anything and for the app to feel alive. This computes
// a deterministic price per company per day — same value for every user on
// the same day (not random per page load, which would look broken/inconsistent
// between the Dashboard and Portfolio). Advancing one calendar day always
// nudges every price a little, in a repeatable, bounded way.

type PriceInput = { id: string; base_price: number };

// simple string hash -> seed
function seed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return h;
}

function daysSinceEpoch(date: Date): number {
  return Math.floor(date.getTime() / 86400000);
}

// Bounded, always-moving: a sum of two sine waves (different periods/phases
// per company, derived from its id) plus a small day-granular noise term.
// Keeps price within roughly +/-12% of base_price, moving daily, never
// drifting away permanently.
export function getSimulatedPrice(company: PriceInput, date: Date = new Date()): number {
  const s = seed(company.id);
  const day = daysSinceEpoch(date);
  const freq1 = 0.03 + (Math.abs(s) % 17) / 900; // slow wave
  const freq2 = 0.11 + (Math.abs(s >> 3) % 23) / 500; // faster wave
  const phase1 = (s % 628) / 100;
  const phase2 = ((s >> 5) % 628) / 100;
  const noiseSeed = Math.sin(day * 12.9898 + s * 0.001) * 43758.5453;
  const noise = (noiseSeed - Math.floor(noiseSeed)) * 0.02 - 0.01; // +/-1%

  const wave = 0.07 * Math.sin(day * freq1 + phase1) + 0.05 * Math.sin(day * freq2 + phase2);
  const multiplier = 1 + wave + noise;
  return Math.round(company.base_price * multiplier * 100) / 100;
}

export function getDailyChangePct(company: PriceInput, date: Date = new Date()): number {
  const today = getSimulatedPrice(company, date);
  const yesterday = getSimulatedPrice(company, new Date(date.getTime() - 86400000));
  if (yesterday === 0) return 0;
  return Math.round(((today - yesterday) / yesterday) * 1000) / 10;
}

// Last `days` closing prices ending today, for the trend chart — this is now
// a real computed series (not a fake illustrative curve), though still not
// "real" market history since there's no live feed underneath it.
export function getPriceHistory(company: PriceInput, days: number, date: Date = new Date()) {
  const out: { day: number; price: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(date.getTime() - i * 86400000);
    out.push({ day: days - i, price: getSimulatedPrice(company, d) });
  }
  return out;
}
