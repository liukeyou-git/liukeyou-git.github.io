import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy="auth-modal-title">
      <h2 id="auth-modal-title" className="sr-only">
        {isLogin ? '登录' : '注册'}
      </h2>

      <div className="flex border-b border-white/10" role="tablist" aria-label="账户操作">
        <button
          role="tab"
          aria-selected={isLogin}
          onClick={() => setIsLogin(true)}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            isLogin ? 'text-text-primary border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          登录
        </button>
        <button
          role="tab"
          aria-selected={!isLogin}
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
          <div className="mb-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg" role="alert">
            {authState.error}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2" htmlFor="login-email">邮箱</label>
              <input
                id="login-email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
                placeholder="请输入邮箱"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2" htmlFor="login-password">密码</label>
              <input
                id="login-password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
                placeholder="请输入密码"
                required
                autoComplete="current-password"
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
              <label className="block text-sm text-text-secondary mb-2" htmlFor="register-email">邮箱</label>
              <input
                id="register-email"
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
                placeholder="请输入邮箱"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2" htmlFor="register-username">用户名</label>
              <input
                id="register-username"
                type="text"
                value={registerData.username}
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
                placeholder="请输入用户名"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2" htmlFor="register-password">密码</label>
              <input
                id="register-password"
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
                placeholder="请输入密码（至少6位）"
                required
                minLength={6}
                autoComplete="new-password"
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
    </Modal>
  );
}
