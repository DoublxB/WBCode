import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'info';
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary'
}: StatCardProps) => {
  const colorClasses = {
    primary: 'from-primary-500/20 to-primary-600/20 border-primary-500/30',
    success: 'from-success-500/20 to-success-600/20 border-success-500/30',
    warning: 'from-warning-500/20 to-warning-600/20 border-warning-500/30',
    info: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  };
  
  const iconColorClasses = {
    primary: 'text-primary-400',
    success: 'text-success-400',
    warning: 'text-warning-400',
    info: 'text-blue-400',
  };
  
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${colorClasses[color]} p-4 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`h-4 w-4 ${iconColorClasses[color]}`} />}
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-[10px] font-semibold ${
            trend === 'up' ? 'text-success-400' : 
            trend === 'down' ? 'text-error-400' : 
            'text-slate-400'
          }`}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trendValue}
          </div>
        )}
      </div>
      
      <div className="mb-1">
        <span className="text-2xl font-bold text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
      
      {subtitle && (
        <p className="text-[11px] text-slate-400">{subtitle}</p>
      )}
    </div>
  );
};

export default StatCard;












