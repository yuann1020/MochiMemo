import type { Session, User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import {
  getCurrentSession,
  loadProfileForUser,
  signInWithOAuthGoogle,
  signInWithPassword,
  signOutCurrentUser,
  signUpWithPassword,
  type AuthCredentials,
  type RegisterCredentials,
} from '@/services/supabase/auth';
import { supabase } from '@/services/supabase/client';
import {
  upsertProfileForUser as upsertProfileRowForUser,
  updateProfile as updateProfileService,
  type UpdateProfileInput,
} from '@/services/supabase/profiles';
import type { Profile } from '@/types/expense';

const REMEMBER_ME_KEY = 'mochimemo_remember_me';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  initializeAuth: () => () => void;
  signIn: (credentials: AuthCredentials & { rememberMe?: boolean }) => Promise<void>;
  signUp: (credentials: RegisterCredentials) => Promise<{ needsEmailConfirmation: boolean }>;
  signInWithGoogle: (rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  updateProfile: (input: UpdateProfileInput) => Promise<Profile>;
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

    // Cold start: check Remember Me preference before restoring session
    void (async () => {
      try {
        const session = await getCurrentSession();

        if (session) {
          const rememberMePref = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
          if (rememberMePref === 'false') {
            await supabase.auth.signOut();
            set({ session: null, user: null, profile: null, loading: false, initialized: true, error: null });
            return;
          }
        }

        await syncSession(session, set);
      } catch (error) {
        set({
          session: null,
          user: null,
          profile: null,
          loading: false,
          initialized: true,
          error: readErrorMessage(error, 'Could not initialize authentication.'),
        });
      }
    })();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        void syncSession(session, set);
      }, 0);
    });

    authSubscriptionCleanup = () => {
      data.subscription.unsubscribe();
      authSubscriptionCleanup = null;
    };

    return authSubscriptionCleanup;
  },

  signIn: async ({ email, password, rememberMe = true }) => {
    set({ loading: true, error: null });

    try {
      const { session, user } = await signInWithPassword({ email, password });
      if (!session || !user) {
        throw new Error('Login succeeded, but no active session was returned.');
      }

      await SecureStore.setItemAsync(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');

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
      const activeUser = session?.user ?? null;
      const needsEmailConfirmation = !session || !user;

      if (session) {
        await SecureStore.setItemAsync(REMEMBER_ME_KEY, 'true');
      }

      set({
        session,
        user: activeUser,
        profile: activeUser ? profile : null,
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

  signInWithGoogle: async (rememberMe = true) => {
    set({ loading: true, error: null });

    try {
      const { session, user } = await signInWithOAuthGoogle();

      if (!session || !user) {
        throw new Error('Google sign-in completed but no session was returned.');
      }

      await SecureStore.setItemAsync(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');

      const profile = await loadProfileForUser(user);
      set({ session, user, profile, loading: false, initialized: true, error: null });
    } catch (error) {
      set({ loading: false, error: readErrorMessage(error, 'Google sign-in failed.') });
      throw error;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });

    try {
      await signOutCurrentUser();
      await SecureStore.deleteItemAsync(REMEMBER_ME_KEY);
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

  updateProfile: async (input) => {
    const user = get().user;
    if (!user) throw new Error('Not signed in.');

    const profile = await updateProfileService(user.id, input);
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
