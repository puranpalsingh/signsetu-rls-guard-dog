'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';


interface UserProfile extends Pick<SupabaseUser, 'id' | 'email'> {
  role?: string;
  full_name?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      setIsLoading(true);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error getting session:', sessionError.message);
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profile')
          .select('role, full_name')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError.message);
        }

        setUser({
          id: session.user.id,
          email: session.user.email,
          role: profile?.role,
          full_name: profile?.full_name,
        });
      } else {
        setUser(null);
      }

      setIsLoading(false);
    };

    // Load current session on mount
    getSessionAndProfile();

    // Subscribe to future auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getSessionAndProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ✅ Safe hook for accessing context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
