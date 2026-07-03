import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { LoginFormData, RegisterFormData } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(defaultTab === 'login');
  const { authState, login, register } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setIsLogin(defaultTab === 'login');
    }
  }, [isOpen, defaultTab]);

  const [loginData, setLoginData] = useState<LoginFormData>({ email: '', password: '' });
  const [registerData, setRegisterData] = useState<RegisterFormData>({ email: '', username: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginData);
    if (!authState.error) {
      onClose();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(registerData);
    if (!authState.error) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-bg-card rounded-xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              isLogin ? 'text-text-primary border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              !isLogin ? 'text-text-primary border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            注册
          </button>
        </div>

        <div className="p-6">
          {authState.error && (
            <div className="mb-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg">
              {authState.error}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">邮箱</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="请输入邮箱"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">密码</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="请输入密码"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={authState.isLoading}
                className="w-full py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authState.isLoading ? '登录中...' : '登录'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">邮箱</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="请输入邮箱"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">用户名</label>
                <input
                  type="text"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="请输入用户名"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">密码</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="请输入密码（至少6位）"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={authState.isLoading}
                className="w-full py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authState.isLoading ? '注册中...' : '注册'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}