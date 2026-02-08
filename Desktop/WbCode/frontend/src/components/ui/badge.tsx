import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
  {
    variants: {
      variant: {
        default: 'border-slate-700 bg-slate-900/40 text-slate-200',
        success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
        warning: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
        info: 'border-blue-400/30 bg-blue-500/10 text-blue-200',
        active: 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}




