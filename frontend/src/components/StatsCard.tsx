import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'purple' | 'amber';
  subtitle?: string;
}

const colorStyles = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
};

const iconColors = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  red: 'text-red-500',
  purple: 'text-purple-500',
  amber: 'text-amber-500',
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  return (
    <div className={`rounded-xl border p-6 shadow-sm flex items-center justify-between ${colorStyles[color]} transition-transform duration-200 hover:-translate-y-1 bg-white bg-opacity-40 backdrop-blur-sm`}>
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
        </div>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-full bg-white shadow-sm ${iconColors[color]}`}>
        <Icon className="w-8 h-8" />
      </div>
    </div>
  );
};

export default StatsCard;
