/**
 * Utility functions for @matrix-lib/ui
 */

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes
    .filter((cls): cls is string => typeof cls === 'string')
    .join(' ');
}

/**
 * Merge class names with tailwind-merge
 */
export { clsx } from 'clsx';
export { twMerge } from 'tailwind-merge';
