import type { ComponentProps } from 'react';

import { IconSymbol } from '@/components/ui/icon-symbol';

type IconName = ComponentProps<typeof IconSymbol>['name'];

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Drinks': '#F472B6',
  Transport: '#60A5FA',
  Shopping: '#A78BFA',
  Entertainment: '#34D399',
  Health: '#F87171',
  Utilities: '#FACC15',
  Education: '#818CF8',
  Other: '#94A3B8',
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[normalizeCategoryLabel(category)] ?? CATEGORY_COLORS.Other;
}

export function getCategoryIcon(category: string): IconName {
  const normalized = normalizeCategoryLabel(category);
  if (normalized === 'Transport') return 'creditcard.fill';
  if (normalized === 'Shopping') return 'banknote.fill';
  return 'tag.fill';
}

export function normalizeCategoryLabel(category: string): string {
  if (/^food\s*&\s*drink$/i.test(category)) return 'Food & Drinks';
  if (/^others$/i.test(category)) return 'Other';
  return category.trim() || 'Other';
}

export function formatExpenseDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  const label = getDateGroupLabel(isoDate);
  return `${label}, ${formatExpenseTime(isoDate)}`;
}

export function formatExpenseTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('en-MY', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getDateGroupLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

export function formatSourceLabel(source: string): string {
  if (source === 'type') return 'Type';
  if (source === 'voice') return 'Voice';
  return 'Manual';
}

export function formatConfidence(confidence: number | null): string {
  if (confidence == null) return 'Not available';
  return `${Math.round(Math.max(0, Math.min(1, confidence)) * 100)}%`;
}
