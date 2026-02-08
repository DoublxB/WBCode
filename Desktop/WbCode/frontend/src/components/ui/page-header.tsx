import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, subtitle, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-sm text-slate-400">{eyebrow}</p>}
        <div className="mt-1 flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="p-2 rounded-xl border border-white/5 bg-slate-900/50 backdrop-blur-md">
              <Icon className="h-5 w-5 text-blue-400" />
            </div>
          )}
          <h1 className="text-3xl font-semibold text-white truncate">{title}</h1>
        </div>
        {subtitle && <p className="mt-2 text-sm text-slate-300 max-w-2xl">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
  );
}




