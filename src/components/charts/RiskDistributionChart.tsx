import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

interface RiskDistributionProps {
  distribution: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
}

export const RiskDistributionChart: React.FC<RiskDistributionProps> = ({ distribution }) => {
  const data = [
    { name: 'Critical Risk', value: distribution.critical, color: '#DC2626' },
    { name: 'High Risk', value: distribution.high, color: '#EA580C' },
    { name: 'Moderate Risk', value: distribution.moderate, color: '#D97706' },
    { name: 'Low Risk', value: distribution.low, color: '#16A34A' },
  ].filter(d => d.value > 0);

  const total = distribution.low + distribution.moderate + distribution.high + distribution.critical;

  return (
    <div className="w-full h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
      <div className="w-48 h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={52}
              outerRadius={74}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0];
                  const percent = total > 0 ? ((Number(d.value) / total) * 100).toFixed(0) : 0;
                  return (
                    <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm text-xs">
                      <p className="font-semibold text-slate-900">{d.name}</p>
                      <p className="text-slate-600 font-mono mt-0.5">
                        {d.value} locations ({percent}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-900 font-mono">{total}</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Zones</span>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-slate-600">{item.name}:</span>
            <span className="font-semibold text-slate-900 font-mono">{item.value}</span>
            <span className="text-slate-400 text-[11px]">
              ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
