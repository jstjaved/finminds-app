"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["#0F9D8C", "#F2A93B", "#14213D", "#FF6B6B", "#8CD9C7", "#5C6784", "#FFD98C"];

export default function AllocationChart({ allocation }: { allocation: { sector: string; value: number }[] }) {
  const total = allocation.reduce((s, a) => s + a.value, 0);
  return (
    <div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={allocation} dataKey="value" nameKey="sector" innerRadius={45} outerRadius={70} paddingAngle={2}>
              {allocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5 mt-2">
        {allocation.map((a, i) => (
          <div key={a.sector} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate">
              <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              {a.sector}
            </span>
            <span className="font-semibold text-ink">{((a.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
