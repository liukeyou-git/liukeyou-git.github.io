'use client';

import { useEffect } from 'react';
import { setLenis } from '../../lib/lenis-instance';

/**
 * Lenis 平滑滚动
 * - prefers-reduced-motion：跳过 Lenis，使用原生滚动
 * - 页面不可见时暂停 rAF，避免后台 CPU 占用
 * - 实例注入 lenis-instance 单例，供 BackToTop 等组件调用 scrollTo
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let lenis: { raf: (time: number) => void; destroy: () => void; start: () => void; stop: () => void; on: (event: string, cb: () => void) => void; scrollTo: (target: number | string | HTMLElement, opts?: { immediate?: boolean }) => void } | null = null;
    let rafId: number | null = null;

    async function init() {
      const LenisModule = await import('lenis');
      const Lenis = LenisModule.default;
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
      });

      // Lenis 1.x 使用内部 Emitter 派发 scroll 事件，不触发 window 的 native scroll 事件。
      // 这里桥接到 window，让依赖 native scroll 事件的组件（如 BackToTop、Header 当前页高亮）正常工作。
      lenis.on('scroll', () => window.dispatchEvent(new Event('scroll')));

      // 注入单例，供 BackToTop / PostEditor 等调用 scrollTo（避免与 Lenis rAF 冲突）
      setLenis(lenis);

      function raf(time: number) {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);
    }

    init();

    // 页面不可见时暂停，可见时恢复
    const onVisibility = () => {
      if (!lenis) return;
      if (document.hidden) {
        lenis.stop();
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      } else {
        lenis.start();
        if (rafId === null) {
          rafId = requestAnimationFrame(function raf(time: number) {
            lenis?.raf(time);
            rafId = requestAnimationFrame(raf);
          });
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (rafId !== null) cancelAnimationFrame(rafId);
      lenis?.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
