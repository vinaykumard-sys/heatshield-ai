import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

interface TempTrendProps {
  data: Array<{
    time: string;
    temperature_c: number;
    heat_index_c: number;
  }>;
}

export const TempTrendChart: React.FC<TempTrendProps> = ({ data }) => {
  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="heatIndexGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EA580C" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#94A3B8" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#94A3B8" 
            fontSize={11} 
            domain={['dataMin - 2', 'dataMax + 4']} 
            tickFormatter={(v) => `${v}°`} 
            tickLine={false} 
            axisLine={false} 
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white border border-[#E2E8F0] p-3 rounded-lg shadow-dropdown text-xs space-y-1">
                    <p className="font-semibold text-slate-900">{label}</p>
                    <p className="text-blue-600 font-medium">
                      Ambient Temp: <span className="font-bold font-mono">{payload[0].value}°C</span>
                    </p>
                    {payload[1] && (
                      <p className="text-orange-600 font-medium">
                        Feels Like (Heat Index): <span className="font-bold font-mono">{payload[1].value}°C</span>
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine y={40} stroke="#DC2626" strokeDasharray="3 3" label={{ value: 'Heatwave Alert (40°C)', fill: '#DC2626', fontSize: 10, position: 'top' }} />
          <Area
            type="monotone"
            dataKey="temperature_c"
            stroke="#2563EB"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#tempGradient)"
            name="Ambient Temp"
          />
          <Area
            type="monotone"
            dataKey="heat_index_c"
            stroke="#EA580C"
            strokeWidth={2}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#heatIndexGradient)"
            name="Heat Index"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
