// FinMinds coins are pegged 1:1 to Indian Rupees (virtual, not real money — this
// just keeps the numbers realistic and meaningful to students). Formatted with
// Indian digit grouping (e.g. 100000 -> "1,00,000") to match how the numbers were
// specified (1,00,000 signup bonus, 10,000 per class, etc).

export function formatCoins(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
