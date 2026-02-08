import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'btn-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary/90',
        secondary: 'bg-slate-800/60 text-slate-100 hover:bg-slate-800/80 border border-slate-700/60',
        ghost: 'bg-transparent text-slate-200 hover:bg-slate-800/40 border border-transparent',
        success: 'bg-emerald-600 text-white hover:bg-emerald-500',
        warning: 'bg-amber-500/15 text-amber-200 hover:bg-amber-500/20 border border-amber-400/30',
        danger: 'bg-rose-500/15 text-rose-200 hover:bg-rose-500/20 border border-rose-400/30'
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-11 px-4',
        lg: 'h-12 px-5'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';


