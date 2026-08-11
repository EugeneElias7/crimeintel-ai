// frontend/src/components/KpiCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, trend, trendUp }) => {
  return (
    <div className="bg-white rounded-[10px] p-5 shadow-[0_1px_2px_rgba(11,18,32,0.06),0_4px_12px_rgba(11,18,32,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[12px] font-medium text-slate-500 uppercase tracking-[0.04em]">
          {title}
        </h3>
        <div className="p-2 bg-slate-50 rounded-lg">
          <Icon className="w-5 h-5 text-cyan-500" />
        </div>
      </div>
      
      <div>
        <div className="text-3xl font-semibold tabular-nums text-slate-900">
          {value}
        </div>
        {trend && (
          <div className={`text-sm mt-2 font-medium ${trendUp ? 'text-emerald-600' : 'text-slate-500'}`}>
            {trendUp ? '↑' : ''} {trend}
          </div>
        )}
      </div>
    </div>
  );
};