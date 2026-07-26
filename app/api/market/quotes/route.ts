import { NextRequest, NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/finnhub";

// GET /api/market/quotes?tickers=AAPL,MSFT,GOOGL
// Runs server-side so the Finnhub key never reaches the browser, and there is
// no browser CORS concern since this is a server-to-server call.
// Used by client components (e.g. a manual "refresh prices" button); server
// components call lib/finnhub.ts directly instead of hitting this route.
export async function GET(req: NextRequest) {
  if (!process.env.FINNHUB_API_KEY) {
    return NextResponse.json({ error: "FINNHUB_API_KEY not configured on the server" }, { status: 500 });
  }
  const tickersParam = req.nextUrl.searchParams.get("tickers") || "";
  const tickers = tickersParam.split(",").map((t) => t.trim()).filter(Boolean);
  const { quotes, errors } = await fetchQuotes(tickers);
  return NextResponse.json({ quotes, errors, attempted: tickers.length });
}
