import { useEffect, useRef, useState } from 'react';

/**
 * Aceternity UI 风格：网格点背景（Grid Dots / Neural Net）
 * - 网格 + 部分节点连接发光线
 * - 节点周期性脉冲
 * - 鼠标位置形成"激活区域"
 *
 * 用于：关于此网站页
 */
export default function GridDotsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let mouseX = -1000;
    let mouseY = -1000;
    const dpr = window.devicePixelRatio || 1;
    const spacing = 36; // 网格间距
    const maxDist = 130; // 连线最大距离
    const activationRadius = 180; // 鼠标激活半径

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      setSize({ w: rect.width, h: rect.height });
    };

    const cols = () => Math.floor(size.w / spacing) + 1;
    const rows = () => Math.floor(size.h / spacing) + 1;

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const onLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    const tick = (t: number) => {
      ctx.clearRect(0, 0, size.w, size.h);
      if (size.w === 0) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const c = cols();
      const r = rows();
      const points: { x: number; y: number; pulse: number }[] = [];

      // 计算所有点的位置 + 脉冲
      for (let i = 0; i < c; i++) {
        for (let j = 0; j < r; j++) {
          const x = i * spacing;
          const y = j * spacing;
          const dx = x - mouseX;
          const dy = y - mouseY;
          const d = Math.sqrt(dx * dx + dy * dy);
          // 距离鼠标越近，脉冲值越大
          const pulse = Math.max(0, 1 - d / activationRadius);
          points.push({ x, y, pulse });
        }
      }

      // 画点
      for (const p of points) {
        const baseAlpha = 0.15 + p.pulse * 0.6;
        const baseRadius = 1 + p.pulse * 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = p.pulse > 0
          ? `rgba(168, 85, 247, ${baseAlpha})` // 激活：紫色
          : `rgba(148, 163, 184, ${baseAlpha})`; // 默认：灰
        ctx.fill();
      }

      // 画连线（只画激活区域内的）
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        if (a.pulse === 0) continue;
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          if (b.pulse === 0) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            const alpha = (1 - d / maxDist) * Math.min(a.pulse, b.pulse) * 0.4;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [size.w, size.h]);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ contain: 'strict' }}
    >
      {/* 顶部紫色光晕 */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[60rem] h-[40rem] rounded-full opacity-30"
        style={{
          background:
            'radial-gradient(ellipse, rgba(139, 92, 246, 0.4), transparent 60%)',
          filter: 'blur(80px)',
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
