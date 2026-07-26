"use client";

import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";

// This is an illustrative 7-point trend building up to today's real price/change —
// it exists to give students a visual sense of "trending up" vs "trending down."
// It is NOT real historical price history: free open APIs don't reliably provide
// that, so we don't fake precision we don't have. A future upgrade could pull
// real daily candles from a paid data provider.
export default function PriceTrend({ price, chg, up }: { price: number; chg: number; up: boolean }) {
  const startPrice = price / (1 + chg / 100);
  const data = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    const noise = Math.sin(i * 1.7) * price * 0.01;
    return { i, v: startPrice + (price - startPrice) * t + noise };
  });
  data[6].v = price;

  return (
    <div style={{ height: 60 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={up ? "#2EC4B6" : "#FF6B6B"} stopOpacity={0.35} />
              <stop offset="100%" stopColor={up ? "#2EC4B6" : "#FF6B6B"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area type="monotone" dataKey="v" stroke={up ? "#1F9E92" : "#FF6B6B"} strokeWidth={2} fill="url(#trend)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
