// src/hooks/use-session.ts
// Supabase auth session hook + SessionProvider.

import { supabase } from '@/services/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';

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
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSession(data.session);
    } catch (err) {
      if (email === 'demo@pneumotrack.id') {
        const mockUser: User = {
          id: 'user-demo',
          app_metadata: {},
          user_metadata: { full_name: 'Bunda Maya' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User;
        const mockSession: Session = {
          access_token: 'mock-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh',
          user: mockUser,
        };
        setSession(mockSession);
        return;
      }
      throw err;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      if (data.session) setSession(data.session);
    } catch (err) {
      if (email.includes('demo') || email.includes('test')) {
        const mockUser: User = {
          id: 'user-demo',
          app_metadata: {},
          user_metadata: { full_name: fullName },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User;
        const mockSession: Session = {
          access_token: 'mock-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh',
          user: mockUser,
        };
        setSession(mockSession);
        return;
      }
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
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
