// src/hooks/use-session.ts
// Supabase auth session hook + SessionProvider.

import { Config } from '@/constants/config';
import { supabase } from '@/services/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';

const DEMO_USER: User = {
  id: 'user-demo',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@pneumotrack.id',
  app_metadata: {},
  user_metadata: { full_name: 'Bunda Sari' },
  created_at: '2026-01-01T00:00:00.000Z',
};

const DEMO_SESSION: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: DEMO_USER,
};

interface SessionContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const bypassSupabase = Config.useMockData && !Config.supabaseUrl;
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!bypassSupabase);

  useEffect(() => {
    if (bypassSupabase) {
      return;
    }

    supabase.auth.getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setIsLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, [bypassSupabase]);

  const signIn = async (email: string, password: string) => {
    if (Config.useMockData && email.trim().toLowerCase() === 'demo@pneumotrack.id') {
      setSession(DEMO_SESSION);
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(data.session);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (Config.useMockData && !Config.supabaseUrl) {
      setSession({
        ...DEMO_SESSION,
        user: {
          ...DEMO_USER,
          email: email.trim(),
          user_metadata: { full_name: fullName.trim() },
        },
      });
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    if (data.session) setSession(data.session);
  };

  const signOut = async () => {
    try {
      if (!Config.useMockData || Config.supabaseUrl) {
        await supabase.auth.signOut();
      }
    } catch {
      // Sign-out error ignored; local session is cleared below
    } finally {
      setSession(null);
    }
  };

  return createElement(
    SessionContext.Provider,
    {
      value: {
        session,
        user: session?.user ?? null,
        isLoading,
        signIn,
        signUp,
        signOut,
      },
    },
    children,
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
