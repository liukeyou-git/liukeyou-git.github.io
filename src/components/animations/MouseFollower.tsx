'use client';

import { useEffect, useRef } from 'react';

interface Particle {
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

export default function MouseFollower() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationId: number;
    let mouseX = -1000;
    let mouseY = -1000;
    let lastMouseX = -1000;
    let lastMouseY = -1000;
    let frameCount = 0;

    const colors = ['#6366f1', '#a855f7', '#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4'];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create background ambient particles
    const ambientCount = 15;
    for (let i = 0; i < ambientCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.3 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: Infinity,
        maxLife: Infinity,
      });
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Update card glow positions
      const glowElements = document.querySelectorAll('.card-glow, .interactive-glow');
      glowElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        (el as HTMLElement).style.setProperty('--mouse-x', `${x}%`);
        (el as HTMLElement).style.setProperty('--mouse-y', `${y}%`);
      });

      // Spawn trail particles
      const dx = mouseX - lastMouseX;
      const dy = mouseY - lastMouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5 && frameCount % 2 === 0) {
        const trailCount = Math.min(3, Math.floor(distance / 20));
        for (let i = 0; i < trailCount; i++) {
          particles.push({
            x: mouseX + (Math.random() - 0.5) * 20,
            y: mouseY + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size: Math.random() * 3 + 1,
            alpha: Math.random() * 0.5 + 0.3,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 60,
            maxLife: 60,
          });
        }
      }

      lastMouseX = mouseX;
      lastMouseY = mouseY;
    };

    const onMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frameCount++;

      // Add subtle glow near mouse
      if (mouseX > 0 && mouseY > 0) {
        const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 120);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.08)');
        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.03)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        if (p.life !== Infinity) {
          p.life--;
          p.alpha *= 0.97;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
        }

        // Mouse attraction for ambient particles
        if (p.life === Infinity && mouseX > 0 && mouseY > 0) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 200) {
            const force = (200 - dist) / 200;
            p.vx += (dx / dist) * force * 0.02;
            p.vy += (dy / dist) * force * 0.02;
          }
        }

        p.vx *= 0.96;
        p.vy *= 0.96;

        p.x += p.vx;
        p.y += p.vy;

        if (p.life === Infinity) {
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.life === Infinity ? 8 : 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      // Draw connection lines between nearby particles
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.globalAlpha = (1 - dist / 100) * 0.2;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      animationId = requestAnimationFrame(draw);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.body.addEventListener('mouseleave', onMouseLeave);
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', onMouseMove);
      document.body.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  );
}
