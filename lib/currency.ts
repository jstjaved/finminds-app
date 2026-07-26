// FinMinds coins are pegged 1:1 to Indian Rupees (virtual, not real money — this
// just keeps the numbers realistic and meaningful to students). Formatted with
// Indian digit grouping (e.g. 100000 -> "1,00,000") to match how the numbers were
// specified (1,00,000 signup bonus, 10,000 per class, etc).

export function formatCoins(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// Approximate USD->INR rate used to convert live US-stock prices (from Finnhub,
// quoted in USD) into the same Rupee-pegged coin economy as the Indian companies,
// which are already priced in Rupees. Update this constant occasionally — it does
// not fetch a live forex rate, to keep the app on Finnhub's free tier.
export const USD_TO_INR = 96.5;
