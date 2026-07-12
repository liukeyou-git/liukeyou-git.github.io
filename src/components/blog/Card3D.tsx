import { useRef, useState, type ReactNode, type CSSProperties } from 'react';

interface Card3DProps {
  children: ReactNode;
  href?: string;
  className?: string;
  /** 最大倾斜角度（度），默认 12 */
  maxTilt?: number;
  /** 高光不透明度 0-1，默认 0.15 */
  glareOpacity?: number;
  /** 是否禁用（用于非链接场景） */
  disabled?: boolean;
}

/**
 * Aceternity UI 风格的 3D 卡片
 * - 鼠标悬浮时跟随倾斜（rotateX/rotateY）
 * - 鼠标位置生成高光（spotlight）
 * - 离开平滑复位
 * - perspective + transform-style: preserve-3d
 */
export default function Card3D({
  children,
  href,
  className = '',
  maxTilt = 12,
  glareOpacity = 0.15,
  disabled = false,
}: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>('');
  const [glare, setGlare] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // 计算倾斜角度（基于偏离中心的比例）
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    const rotateX = -((y - centerY) / centerY) * maxTilt;
    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    );
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: glareOpacity,
    });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlare((g) => ({ ...g, opacity: 0 }));
  };

  const wrapperStyle: CSSProperties = {
    transform,
    transition: 'transform 0.3s ease-out',
    transformStyle: 'preserve-3d',
    willChange: 'transform',
  };

  const inner = (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={wrapperStyle}
    >
      {children}

      {/* 鼠标高光层 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(circle 250px at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.6), transparent 60%)`,
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );

  if (href && !disabled) {
    return (
      <a href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl">
        {inner}
      </a>
    );
  }
  return inner;
}
