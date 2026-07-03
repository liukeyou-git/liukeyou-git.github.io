import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
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

// ========== 模块级单例 ==========
// 多个 AuthProvider 共享同一份认证状态，避免重复请求
type Listener = (state: AuthState) => void;

interface AuthStore {
  state: AuthState;
  initialized: boolean;
  initPromise: Promise<void> | null;
  listeners: Set<Listener>;
}

const globalAny = globalThis as unknown as { __authStore?: AuthStore };

function getStore(): AuthStore {
  if (!globalAny.__authStore) {
    globalAny.__authStore = {
      state: { user: null, isLoading: true, error: null },
      initialized: false,
      initPromise: null,
      listeners: new Set(),
    };
  }
  return globalAny.__authStore;
}

function setGlobalState(newState: AuthState) {
  const store = getStore();
  store.state = newState;
  store.listeners.forEach((listener) => listener(newState));
}

async function fetchProfile(userId: string, email: string): Promise<User> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profile) {
    return {
      id: profile.id,
      email: email,
      username: profile.username,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
    };
  }

  // Profile 不存在则自动创建
  const username = email.split('@')[0] || 'user';
  await supabase.from('profiles').insert({ id: userId, username });
  return { id: userId, email, username };
}

async function initAuth(): Promise<void> {
  const store = getStore();
  if (store.initialized) return;
  if (store.initPromise) return store.initPromise;

  store.initPromise = (async () => {
    if (!supabase) {
      setGlobalState({ user: null, isLoading: false, error: null });
      store.initialized = true;
      return;
    }

    // 1. 检查当前 session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      try {
        const user = await fetchProfile(session.user.id, session.user.email || '');
        setGlobalState({ user, isLoading: false, error: null });
      } catch (err) {
        console.error('加载 profile 失败:', err);
        setGlobalState({ user: null, isLoading: false, error: null });
      }
    } else {
      setGlobalState({ user: null, isLoading: false, error: null });
    }

    // 2. 监听认证状态变化（全局只订阅一次）
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id, session.user.email || '')
          .then((user) => setGlobalState({ user, isLoading: false, error: null }))
          .catch((err) => {
            console.error('认证状态变化处理失败:', err);
            setGlobalState({ user: null, isLoading: false, error: null });
          });
      } else {
        setGlobalState({ user: null, isLoading: false, error: null });
      }
    });

    store.initialized = true;
  })();

  return store.initPromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const store = getStore();
  const [authState, setLocalState] = useState<AuthState>(store.state);
  const mountedRef = useRef(false);

  // 只在第一个 Provider 中执行初始化
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    initAuth();
  }, []);

  // 订阅全局状态变化
  useEffect(() => {
    const listener: Listener = (state) => setLocalState(state);
    store.listeners.add(listener);
    // 立即同步一次
    setLocalState(store.state);
    return () => {
      store.listeners.delete(listener);
    };
  }, [store]);

  const isEnabled = supabase !== null;

  const login = async (data: LoginFormData) => {
    if (!supabase) return;
    setGlobalState({ ...store.state, isLoading: true, error: null });
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setGlobalState({ ...store.state, isLoading: false, error: error.message });
    }
  };

  const register = async (data: RegisterFormData) => {
    if (!supabase) return;
    setGlobalState({ ...store.state, isLoading: true, error: null });
    const { user, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (authError) {
      setGlobalState({ ...store.state, isLoading: false, error: authError.message });
      return;
    }
    if (user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        username: data.username,
      });
      if (profileError) {
        setGlobalState({ ...store.state, isLoading: false, error: profileError.message });
        return;
      }
      setGlobalState({ ...store.state, isLoading: false, error: null });
    } else {
      setGlobalState({ ...store.state, isLoading: false, error: '注册失败，请重试' });
    }
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setGlobalState({ user: null, isLoading: false, error: null });
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
