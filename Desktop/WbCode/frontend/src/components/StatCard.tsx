import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string | ReactNode;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'info' | 'secondary';
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
    primary: 'from-blue-500/30 via-blue-600/20 to-blue-500/20 border-blue-400/40 hover:border-blue-400/60',
    success: 'from-green-500/30 via-emerald-500/20 to-green-500/20 border-green-400/40 hover:border-green-400/60',
    warning: 'from-amber-500/30 via-orange-500/20 to-amber-500/20 border-amber-400/40 hover:border-amber-400/60',
    info: 'from-blue-500/30 via-blue-600/20 to-blue-500/20 border-blue-400/40 hover:border-blue-400/60',
    secondary: 'from-purple-500/30 via-fuchsia-500/20 to-purple-500/20 border-purple-400/40 hover:border-purple-400/60',
  };
  
  const iconColorClasses = {
    primary: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-amber-400',
    info: 'text-blue-400',
    secondary: 'text-purple-400',
  };

  const iconBgClasses = {
    primary: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20',
    success: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
    warning: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20',
    info: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20',
    secondary: 'bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20',
  };
  
  return (
    <div className={`group relative rounded-xl border-2 bg-gradient-to-br ${colorClasses[color]} p-4 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] overflow-hidden`}>
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-shift`} 
           style={{ backgroundSize: '200% 200%' }} />
      
      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" 
             style={{ backgroundSize: '200% 100%' }} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className={`p-1.5 rounded-lg ${iconBgClasses[color]} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`h-4 w-4 ${iconColorClasses[color]} drop-shadow-lg`} />
              </div>
            )}
            <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider group-hover:text-white transition-colors flex items-center gap-1.5">
              {typeof title === 'string' ? <span>{title}</span> : title}
            </div>
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              trend === 'up' ? 'bg-emerald-500/20 text-emerald-300' : 
              trend === 'down' ? 'bg-red-500/20 text-red-300' : 
              'bg-slate-500/20 text-slate-400'
            }`}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trendValue}
            </div>
          )}
        </div>
        
        <div className="mb-1">
          <span className="text-2xl font-bold text-white drop-shadow-lg group-hover:scale-105 transition-transform duration-300 inline-block">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        </div>
        
        {subtitle && (
          <p className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;












