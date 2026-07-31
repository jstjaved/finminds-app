"use client";

import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";

export default function PriceTrend({ history, up }: { history: { day: number; price: number }[]; up: boolean }) {
  return (
    <div style={{ height: 70 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={history}>
          <defs>
            <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={up ? "#0F9D8C" : "#FF6B6B"} stopOpacity={0.35} />
              <stop offset="100%" stopColor={up ? "#0F9D8C" : "#FF6B6B"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area type="monotone" dataKey="price" stroke={up ? "#0B7A6C" : "#FF6B6B"} strokeWidth={2} fill="url(#trend)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
