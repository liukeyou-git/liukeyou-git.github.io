import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, AuthState, LoginFormData, RegisterFormData } from '../types';

interface AuthContextType {
  authState: AuthState;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  isEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  const isEnabled = supabase !== null;

  useEffect(() => {
    if (!supabase) {
      setAuthState({ user: null, isLoading: false, error: null });
      return;
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setAuthState({
          user: profile
            ? {
                id: profile.id,
                email: session.user.email || '',
                username: profile.username,
                avatar_url: profile.avatar_url,
                bio: profile.bio,
              }
            : {
                id: session.user.id,
                email: session.user.email || '',
                username: session.user.email?.split('@')[0] || '',
              },
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState({ user: null, isLoading: false, error: null });
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            setAuthState({
              user: profile
                ? {
                    id: profile.id,
                    email: session.user.email || '',
                    username: profile.username,
                    avatar_url: profile.avatar_url,
                    bio: profile.bio,
                  }
                : {
                    id: session.user.id,
                    email: session.user.email || '',
                    username: session.user.email?.split('@')[0] || '',
                  },
              isLoading: false,
              error: null,
            });
          });
      } else {
        setAuthState({ user: null, isLoading: false, error: null });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (data: LoginFormData) => {
    if (!supabase) return;
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false, error: error.message }));
    }
  };

  const register = async (data: RegisterFormData) => {
    if (!supabase) return;
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    const { user, session, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (authError) {
      setAuthState((prev) => ({ ...prev, isLoading: false, error: authError.message }));
      return;
    }

    if (user && session) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        username: data.username,
      });
      if (profileError) {
        setAuthState((prev) => ({ ...prev, isLoading: false, error: profileError.message }));
        return;
      }
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    } else if (user && !session) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: '注册成功，请检查邮箱验证后再登录',
      }));
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false, error: '注册失败，请重试' }));
    }
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthState({ user: null, isLoading: false, error: null });
  };

  return (
    <AuthContext.Provider value={{ authState, login, register, logout, isEnabled }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}