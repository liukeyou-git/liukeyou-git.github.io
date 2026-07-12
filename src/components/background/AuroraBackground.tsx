import { useEffect, useRef } from 'react';

/**
 * Aceternity UI 风格：极光背景（Aurora Background）
 * - 多层径向渐变（紫/蓝/品红/青）缓慢漂移
 * - 大模糊 + 缓慢动画
 * - 鼠标移动时整体平移
 *
 * 用于：文章详情页
 */
export default function AuroraBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0;

    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      tx = x;
      ty = y;
    };

    const tick = () => {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      el.style.setProperty('--ax', `${cx}px`);
      el.style.setProperty('--ay', `${cy}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        contain: 'strict',
        willChange: 'transform',
        transform: 'translate3d(var(--ax, 0), var(--ay, 0), 0)',
      }}
    >
      {/* 顶部光晕（紫） */}
      <div
        className="absolute -top-40 -left-40 w-[60rem] h-[60rem] rounded-full opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.5), rgba(139, 92, 246, 0.15) 40%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'aurora1 18s ease-in-out infinite',
        }}
      />
      {/* 右上（品红） */}
      <div
        className="absolute -top-20 -right-40 w-[55rem] h-[55rem] rounded-full opacity-30"
        style={{
          background:
            'radial-gradient(circle, rgba(236, 72, 153, 0.4), rgba(236, 72, 153, 0.1) 40%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'aurora2 22s ease-in-out infinite',
        }}
      />
      {/* 中部（蓝） */}
      <div
        className="absolute top-1/3 left-1/4 w-[50rem] h-[50rem] rounded-full opacity-25"
        style={{
          background:
            'radial-gradient(circle, rgba(99, 102, 241, 0.45), rgba(99, 102, 241, 0.1) 40%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'aurora3 25s ease-in-out infinite',
        }}
      />
      {/* 底部（青） */}
      <div
        className="absolute bottom-0 right-1/4 w-[45rem] h-[45rem] rounded-full opacity-20"
        style={{
          background:
            'radial-gradient(circle, rgba(34, 211, 238, 0.35), rgba(34, 211, 238, 0.1) 40%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'aurora4 20s ease-in-out infinite',
        }}
      />

      {/* 底部柔和渐变（让过渡自然） */}
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-transparent" />
    </div>
  );
}
