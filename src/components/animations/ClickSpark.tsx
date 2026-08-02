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
 * - 带初速度、重力、淡出，约 600ms 消亡
 * - 无点击时空跑开销极低
 */
export default function ClickSpark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sparks: Spark[] = [];
    let animationId: number;

    // 浅蓝系混色（sky-400 / cyan-400 / sky-300）
    const colors = ['#38bdf8', '#22d3ee', '#7dd3fc', '#60a5fa'];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

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

      animationId = requestAnimationFrame(draw);
    };

    window.addEventListener('click', onClick, { passive: true });
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', onClick);
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
