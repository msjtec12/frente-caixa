"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartData {
  date: string;
  total: number;
}

export function DashboardCharts({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$ ${value}`}
        />
        <Tooltip 
          formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, "Total"]}
          labelStyle={{ color: 'black' }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#16a34a"
          fillOpacity={1}
          fill="url(#colorTotal)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
