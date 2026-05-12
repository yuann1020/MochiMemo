import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase/client';
import { getProfile, upsertProfileForUser } from '@/services/supabase/profiles';
import type { Profile } from '@/types/expense';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends AuthCredentials {
  displayName: string;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function signInWithPassword({
  email,
  password,
}: AuthCredentials): Promise<{ session: Session | null; user: User | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return { session: data.session, user: data.user };
}

export async function signUpWithPassword({
  displayName,
  email,
  password,
}: RegisterCredentials): Promise<{ session: Session | null; user: User | null; profile: Profile | null }> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        display_name: displayName.trim(),
      },
    },
  });

  if (error) throw error;

  const profile = data.user && data.session
    ? await upsertProfileForUser(data.user, displayName)
    : null;

  return { session: data.session, user: data.user, profile };
}

export async function signOutCurrentUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function loadProfileForUser(user: User): Promise<Profile> {
  const profile = await getProfile(user.id);
  return profile ?? upsertProfileForUser(user);
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.access_token ?? null;
}

export async function getEdgeFunctionAuthHeaders(): Promise<Record<string, string> | undefined> {
  const accessToken = await getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}
