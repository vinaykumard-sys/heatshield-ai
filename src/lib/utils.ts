import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RiskCategory } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(isoString?: string): string {
  if (!isoString) return 'Never';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 2) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return isoString;
  }
}

export function getRiskColorClass(category: RiskCategory): {
  badge: string;
  border: string;
  text: string;
  bg: string;
  dot: string;
} {
  switch (category) {
    case 'critical':
      return {
        badge: 'bg-red-50 text-red-700 border border-red-200',
        border: 'border-red-200',
        text: 'text-red-700',
        bg: 'bg-red-50/50',
        dot: 'bg-red-600',
      };
    case 'high':
      return {
        badge: 'bg-orange-50 text-orange-700 border border-orange-200',
        border: 'border-orange-200',
        text: 'text-orange-700',
        bg: 'bg-orange-50/50',
        dot: 'bg-orange-600',
      };
    case 'moderate':
      return {
        badge: 'bg-amber-50 text-amber-700 border border-amber-200',
        border: 'border-amber-200',
        text: 'text-amber-700',
        bg: 'bg-amber-50/50',
        dot: 'bg-amber-600',
      };
    case 'low':
    default:
      return {
        badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        bg: 'bg-emerald-50/50',
        dot: 'bg-emerald-600',
      };
  }
}
