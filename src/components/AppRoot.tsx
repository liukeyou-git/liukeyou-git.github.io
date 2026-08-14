import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from '../contexts/AuthContext';
import SmoothScroll from './animations/SmoothScroll';
import ClickSpark from './animations/ClickSpark';
import BackToTop from './ui/BackToTop';
import Header from './layout/Header';

interface AppRootProps {
  children: React.ReactNode;
}

/**
 * 应用根（客户端 island）
 * - MotionConfig reducedMotion="user"：全站 Framer Motion 组件自动尊重用户偏好
 * - SmoothScroll / ClickSpark 已自带 reduced-motion 与 visibilitychange 守卫
 * - 轻量 interactive-glow 监听：为 .interactive-glow 按钮更新 --mouse-x/--mouse-y（非 Canvas，无 rAF）
 */
export default function AppRoot({ children }: AppRootProps) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMouseMove = (e: MouseEvent) => {
      const els = document.querySelectorAll<HTMLElement>('.interactive-glow');
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // 仅更新鼠标悬停范围内的元素，避免无谓写入
        if (
          e.clientX < rect.left - 20 ||
          e.clientX > rect.right + 20 ||
          e.clientY < rect.top - 20 ||
          e.clientY > rect.bottom + 20
        )
          return;
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--mouse-x', `${x}%`);
        el.style.setProperty('--mouse-y', `${y}%`);
      });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <SmoothScroll />
        <ClickSpark />
        <Header />
        {children}
        <BackToTop />
      </AuthProvider>
    </MotionConfig>
  );
}
