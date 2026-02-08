import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind-friendly className merge helper (shadcn-style).
 * Usage: cn('p-2', condition && 'bg-red-500')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}




