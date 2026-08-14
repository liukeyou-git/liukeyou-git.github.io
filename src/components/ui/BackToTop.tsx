'use client';

import { useState, useEffect } from 'react';
import { scrollToTop } from '../../lib/lenis-instance';

interface BackToTopProps {
  /** 滚动超过该值（px）才显示按钮，默认 400 */
  threshold?: number;
  className?: string;
}

/**
 * 返回顶部按钮
 * - 滚动超过 threshold 用内联样式 + CSS 过渡淡入缩放
 * - 点击平滑回顶（reduced-motion 下瞬时，由 lenis-instance 处理）
 * - aria-label / aria-hidden / tabIndex 完整
 *
 * 实现说明：
 * 1. 按钮常驻 DOM，opacity/scale/pointerEvents 用内联样式随 visible 切换。
 *    不使用 Framer Motion（实测 animate prop 不随 visible 更新，opacity 卡在
 *    initial 值）；也不用 Tailwind 的 opacity-100/scale-100 等动态类（HMR 下
 *    Tailwind 4 扫描器未必重新生成这些工具类）。内联样式最可靠，且
 *    global.css 的 prefers-reduced-motion 块用 !important 强制 transition-duration
 *    为 0.01ms，自动尊重用户偏好。
 * 2. 回顶走 lenis-instance 的 scrollToTop：Lenis 活跃时用 lenis.scrollTo，
 *    否则回退原生 window.scrollTo（Lenis 的 rAF 会覆盖原生 scrollTo，必须走其 API）。
 * 3. 滚动监听：window 的 native scroll 事件由 SmoothScroll 中的
 *    lenis.on('scroll') 桥接派发，保证 Lenis 驱动滚动时也能触发。
 */
export default function BackToTop({ threshold = 400, className = '' }: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const handleClick = () => {
    scrollToTop();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-accent text-white shadow-lg shadow-accent/30 flex items-center justify-center hover:bg-accent-hover ${className}`}
      aria-label="返回顶部"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.9)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease',
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
      </svg>
    </button>
  );
}
