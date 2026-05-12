import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import {
  getCurrentSession,
  loadProfileForUser,
  signInWithPassword,
  signOutCurrentUser,
  signUpWithPassword,
  type AuthCredentials,
  type RegisterCredentials,
} from '@/services/supabase/auth';
import { supabase } from '@/services/supabase/client';
import { upsertProfileForUser as upsertProfileRowForUser } from '@/services/supabase/profiles';
import type { Profile } from '@/types/expense';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  initializeAuth: () => () => void;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signUp: (credentials: RegisterCredentials) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  upsertProfileForUser: (displayName?: string | null) => Promise<Profile | null>;
  clearError: () => void;
}

let authSubscriptionCleanup: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  error: null,
  initialized: false,

  initializeAuth: () => {
    if (authSubscriptionCleanup) return authSubscriptionCleanup;

    set({ loading: true, error: null });

    void getCurrentSession()
      .then((session) => syncSession(session, set))
      .catch((error) => {
        set({
          session: null,
          user: null,
          profile: null,
          loading: false,
          initialized: true,
          error: readErrorMessage(error, 'Could not initialize authentication.'),
        });
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session, set);
    });

    authSubscriptionCleanup = () => {
      data.subscription.unsubscribe();
      authSubscriptionCleanup = null;
    };

    return authSubscriptionCleanup;
  },

  signIn: async (credentials) => {
    set({ loading: true, error: null });

    try {
      const { session, user } = await signInWithPassword(credentials);
      if (!session || !user) {
        throw new Error('Login succeeded, but no active session was returned.');
      }

      const profile = await loadProfileForUser(user);
      set({ session, user, profile, loading: false, initialized: true, error: null });
    } catch (error) {
      set({ loading: false, error: readErrorMessage(error, 'Could not log in.') });
      throw error;
    }
  },

  signUp: async (credentials) => {
    set({ loading: true, error: null });

    try {
      const { session, user, profile } = await signUpWithPassword(credentials);
      const needsEmailConfirmation = !session || !user;

      set({
        session,
        user,
        profile,
        loading: false,
        initialized: true,
        error: needsEmailConfirmation
          ? 'Account created. Check your email to confirm before logging in.'
          : null,
      });

      return { needsEmailConfirmation };
    } catch (error) {
      set({ loading: false, error: readErrorMessage(error, 'Could not create account.') });
      throw error;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });

    try {
      await signOutCurrentUser();
      set({ session: null, user: null, profile: null, loading: false, initialized: true });
    } catch (error) {
      set({ loading: false, error: readErrorMessage(error, 'Could not log out.') });
      throw error;
    }
  },

  refreshProfile: async () => {
    const user = get().user;
    if (!user) {
      set({ profile: null });
      return null;
    }

    const profile = await loadProfileForUser(user);
    set({ profile, error: null });
    return profile;
  },

  upsertProfileForUser: async (displayName) => {
    const user = get().user;
    if (!user) return null;

    const profile = await upsertProfileRowForUser(user, displayName);
    set({ profile, error: null });
    return profile;
  },

  clearError: () => set({ error: null }),
}));

async function syncSession(
  session: Session | null,
  set: (patch: Partial<AuthState>) => void,
): Promise<void> {
  if (!session?.user) {
    set({
      session: null,
      user: null,
      profile: null,
      loading: false,
      initialized: true,
      error: null,
    });
    return;
  }

  set({ session, user: session.user, loading: true, error: null });

  try {
    const profile = await loadProfileForUser(session.user);
    set({
      session,
      user: session.user,
      profile,
      loading: false,
      initialized: true,
      error: null,
    });
  } catch (error) {
    set({
      session,
      user: session.user,
      profile: null,
      loading: false,
      initialized: true,
      error: readErrorMessage(error, 'Could not load your profile.'),
    });
  }
}

function readErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
