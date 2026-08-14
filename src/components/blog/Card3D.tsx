import { useRef, type ReactNode, type CSSProperties } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  useReducedMotion,
} from 'framer-motion';

interface Card3DProps {
  children: ReactNode;
  href?: string;
  className?: string;
  /** 最大倾斜角度（度），默认 12 */
  maxTilt?: number;
  /** 聚光不透明度 0-100（百分比，传给 color-mix），默认 15 */
  glareOpacity?: number;
  /** 聚光半径 px，默认 250 */
  spotlightRadius?: number;
  /** 是否禁用倾斜与跳转（用于非交互场景） */
  disabled?: boolean;
}

const springConfig = { damping: 30, stiffness: 100, mass: 2 };

/**
 * 3D 倾斜卡片（react-bits SpotlightCard + TiltedCard 模式合体）
 * - 倾斜：useMotionValue + useSpring + useMotionTemplate 写入 motion.div style，鼠标移动零 React 重渲染
 * - 聚光：onMouseMove 直接写 CSS 变量 --mouse-x/--mouse-y，由 .card-glow::before 渲染
 * - 键盘可访问：:focus-within 触发聚光（CSS 级，无需 JS）
 * - prefers-reduced-motion：仅保留聚光，关闭倾斜
 */
export default function Card3D({
  children,
  href,
  className = '',
  maxTilt = 12,
  glareOpacity = 15,
  spotlightRadius = 250,
  disabled = false,
}: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scale = useMotionValue(1);

  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);
  const springScale = useSpring(scale, springConfig);

  const transform = useMotionTemplate`perspective(1000px) rotateX(${springRotateX}deg) rotateY(${springRotateY}deg) scale3d(${springScale}, ${springScale}, 1)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // CSS 变量聚光（零重渲染，浏览器原生优化路径）
    const el = ref.current;
    el.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    el.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);

    // 倾斜与缩放 motion value（零重渲染，spring 物理平滑）
    if (!reduce) {
      rotateX.set(-((y - centerY) / centerY) * maxTilt);
      rotateY.set(((x - centerX) / centerX) * maxTilt);
      scale.set(1.02);
    }
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  };

  const baseStyle = {
    transformStyle: 'preserve-3d',
    willChange: 'transform',
    '--glare-opacity': `${glareOpacity}%`,
    '--spotlight-radius': `${spotlightRadius}px`,
  } as CSSProperties;

  const inner = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`card-glow relative overflow-hidden rounded-xl ${className}`}
      style={disabled ? baseStyle : { ...baseStyle, transform }}
    >
      {children}
    </motion.div>
  );

  if (href && !disabled) {
    return (
      <a
        href={href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
      >
        {inner}
      </a>
    );
  }
  return inner;
}
