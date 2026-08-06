import { useRef, useState, type ReactNode, type CSSProperties, type MouseEvent } from 'react';

interface BorderGlowProps {
  children: ReactNode;
  className?: string;
  /** 3 个 hex 色，组成 mesh 流动边框 */
  colors?: [string, string, string];
  /** 光晕颜色，HSL 值字符串，如 "199 89 48"（sky-400） */
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  /** 光晕扩散半径（px） */
  glowRadius?: number;
  /** 光晕强度倍率 0.1-3 */
  glowIntensity?: number;
  /** 鼠标距边缘多近时显示光晕（0-100，百分比） */
  edgeSensitivity?: number;
  /** 挂载时播放一次扫过动画 */
  animated?: boolean;
  style?: CSSProperties;
}

/**
 * 边框流光 + 鼠标定向光晕
 * 基于 react-bits BorderGlow 效果实现：mesh 渐变边框持续旋转流动，
 * 鼠标靠近边缘时浅蓝锥形光晕跟随指针方向。
 */
export default function BorderGlow({
  children,
  className = '',
  colors = ['#38bdf8', '#60a5fa', '#22d3ee'],
  glowColor = '199 89 48',
  backgroundColor = 'var(--color-bg-card)',
  borderRadius = 24,
  glowRadius = 40,
  glowIntensity = 1,
  edgeSensitivity = 30,
  animated = false,
  style,
}: BorderGlowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50, visible: false });

  const handleMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const dx = Math.min(x, 100 - x);
    const dy = Math.min(y, 100 - y);
    setPos({ x, y, visible: Math.min(dx, dy) <= edgeSensitivity });
  };

  return (
    <div
      ref={ref}
      className={`border-glow ${animated ? 'border-glow--animated' : ''} ${className}`}
      style={{
        '--bg-radius': `${borderRadius}px`,
        '--bg-c1': colors[0],
        '--bg-c2': colors[1],
        '--bg-c3': colors[2],
        '--bg-glow-color': glowColor,
        '--bg-glow-radius': `${glowRadius}px`,
        '--bg-glow-intensity': glowIntensity,
        '--bg-card': backgroundColor,
        '--gx': `${pos.x}%`,
        '--gy': `${pos.y}%`,
        '--go': pos.visible ? 1 : 0,
        ...style,
      } as CSSProperties}
      onMouseMove={handleMove}
      onMouseLeave={() => setPos((p) => ({ ...p, visible: false }))}
    >
      <div className="border-glow__inner">{children}</div>
      <div className="border-glow__cursor" aria-hidden="true" />
    </div>
  );
}
