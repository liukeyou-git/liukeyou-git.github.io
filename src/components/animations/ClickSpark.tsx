'use client';

import { useEffect, useRef } from 'react';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

/**
 * 点击粒子火花
 * - 全局监听 click，在点击坐标迸发浅蓝粒子
 * - 按需 rAF：sparks 为空时不跑循环，无点击时 CPU 占用为 0
 * - prefers-reduced-motion：不启动
 */
export default function ClickSpark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sparks: Spark[] = [];
    let animationId: number | null = null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const colors = ['#38bdf8', '#22d3ee', '#7dd3fc', '#60a5fa'];

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const onClick = (e: MouseEvent) => {
      const count = 14;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = Math.random() * 4 + 2;
        sparks.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 2.5 + 1,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 36,
          maxLife: 36,
        });
      }
      // 若 rAF 未运行则启动
      if (animationId === null) {
        draw();
      }
    };

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life--;
        s.alpha = s.life / s.maxLife;

        // 重力 + 阻尼
        s.vy += 0.12;
        s.vx *= 0.98;
        s.vy *= 0.98;
        s.x += s.vx;
        s.y += s.vy;

        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      // sparks 为空则停止循环（按需 rAF 核心）
      if (sparks.length === 0) {
        animationId = null;
        return;
      }
      animationId = requestAnimationFrame(draw);
    }

    window.addEventListener('click', onClick, { passive: true });

    return () => {
      if (animationId !== null) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', onClick);
      sparks = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[60]"
      aria-hidden="true"
    />
  );
}
