import type { User } from '@supabase/supabase-js';

import { DEFAULT_CURRENCY } from '@/constants/config';
import { supabase } from '@/services/supabase/client';
import type { Database } from '@/types/database';
import type { Profile } from '@/types/expense';

export const DEFAULT_MONTHLY_BUDGET = 2000;

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface UpdateProfileInput {
  displayName?: string | null;
  currency?: string;
  monthlyBudget?: number;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToProfile(data) : null;
}

export async function upsertProfileForUser(
  user: User,
  displayName?: string | null,
): Promise<Profile> {
  const fallbackName = readDisplayName(user, displayName);
  const row: ProfileInsert = {
    id: user.id,
    display_name: fallbackName,
    currency: DEFAULT_CURRENCY,
    monthly_budget: DEFAULT_MONTHLY_BUDGET,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return rowToProfile(data);
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
  const row: ProfileUpdate = {};
  if (input.displayName !== undefined) row.display_name = input.displayName?.trim() || null;
  if (input.currency !== undefined) row.currency = input.currency.trim().toUpperCase();
  if (input.monthlyBudget !== undefined) row.monthly_budget = input.monthlyBudget;

  const { data, error } = await supabase
    .from('profiles')
    .update(row)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return rowToProfile(data);
}

export function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    currency: row.currency ?? DEFAULT_CURRENCY,
    monthlyBudget: row.monthly_budget == null
      ? DEFAULT_MONTHLY_BUDGET
      : toNumber(row.monthly_budget),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function readDisplayName(user: User, displayName?: string | null): string | null {
  if (displayName?.trim()) return displayName.trim();

  const metadataName = user.user_metadata?.display_name;
  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim();
  }

  return user.email?.split('@')[0] ?? null;
}

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}
