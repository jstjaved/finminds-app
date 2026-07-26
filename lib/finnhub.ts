import { USD_TO_INR } from "@/lib/currency";

export type FinnhubQuote = { price: number; chg: number };

export async function fetchQuotes(tickers: string[]): Promise<{ quotes: Record<string, FinnhubQuote>; errors: string[] }> {
  const apiKey = process.env.FINNHUB_API_KEY;
  const quotes: Record<string, FinnhubQuote> = {};
  const errors: string[] = [];
  if (!apiKey || tickers.length === 0) return { quotes, errors: tickers };

  for (const ticker of tickers) {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (typeof data.c === "number" && data.c > 0) {
        // Finnhub returns USD; convert to INR so coins stay 1:1 with Rupees
        // across both live (US) and simulated (India) companies.
        quotes[ticker] = { price: Math.round(data.c * USD_TO_INR * 100) / 100, chg: Math.round((data.dp || 0) * 100) / 100 };
      } else {
        errors.push(ticker);
      }
    } catch {
      errors.push(ticker);
    }
  }
  return { quotes, errors };
}
