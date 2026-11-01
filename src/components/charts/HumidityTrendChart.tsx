import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface HumidityTrendProps {
  data: Array<{
    time: string;
    relative_humidity_pct: number;
  }>;
}

export const HumidityTrendChart: React.FC<HumidityTrendProps> = ({ data }) => {
  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#94A3B8" 
            fontSize={11} 
            tickLine={false} 
            axisLine={{ stroke: '#E2E8F0' }} 
          />
          <YAxis 
            stroke="#94A3B8" 
            fontSize={11} 
            domain={[0, 100]} 
            tickFormatter={(v) => `${v}%`} 
            tickLine={false} 
            axisLine={{ stroke: '#E2E8F0' }} 
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm text-xs space-y-1">
                    <p className="font-semibold text-slate-900">{label}</p>
                    <p className="text-slate-600">
                      Relative Humidity: <span className="font-semibold text-blue-600 font-mono">{payload[0].value}%</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="relative_humidity_pct"
            fill="#2563EB"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
            name="Humidity"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
