import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** shadcn-style class merger */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
