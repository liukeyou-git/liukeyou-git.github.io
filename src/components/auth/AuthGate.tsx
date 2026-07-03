import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';

interface AuthGateProps {
  children: React.ReactNode;
  message?: string;
}

export default function AuthGate({ children, message = '请先登录后再进行此操作' }: AuthGateProps) {
  const { authState, isEnabled } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isEnabled) {
    return (
      <div className="text-text-secondary text-center py-12">
        评论功能暂不可用（缺少 Supabase 配置）
      </div>
    );
  }

  if (authState.isLoading) {
    return (
      <div className="text-center py-12">
        <svg className="animate-spin h-6 w-6 text-accent mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!authState.user) {
    return (
      <>
        <div className="text-center py-16 px-6 rounded-xl bg-bg-card border border-white/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent mx-auto mb-4"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <p className="text-text-primary text-lg mb-2 font-medium">{message}</p>
          <p className="text-text-secondary text-sm mb-6">登录后即可使用此功能</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-all active:scale-95"
          >
            登录 / 注册
          </button>
        </div>
        <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return <>{children}</>;
}
