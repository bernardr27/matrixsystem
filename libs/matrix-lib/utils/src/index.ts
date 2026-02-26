import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(input: Date | string | number): string {
  const date = new Date(input);
  const diffMs = Date.now() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (Math.abs(diffMs) < minute) return 'just now';
  if (Math.abs(diffMs) < hour) return `${Math.round(diffMs / minute)}m ago`;
  if (Math.abs(diffMs) < day) return `${Math.round(diffMs / hour)}h ago`;

  return `${Math.round(diffMs / day)}d ago`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
