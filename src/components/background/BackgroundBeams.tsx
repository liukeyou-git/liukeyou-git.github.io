import { useEffect, useRef } from "react";

/**
 * Aceternity UI 风格的背景光束组件
 * - 多条贝塞尔曲线路径 + 渐变流动
 * - 鼠标移动时整体倾斜
 * - 性能优化：减少 path 数量 + CSS will-change
 */
export default function BackgroundBeams() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 ~ 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 30; // 最大倾斜 30px
      targetY = y * 30;
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const tick = () => {
      // 平滑插值
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      container.style.setProperty("--beam-x", `${currentX}px`);
      container.style.setProperty("--beam-y", `${currentY}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  // 6 条光束：奇偶交错、不同延迟、不同位置
  const beams = [
    { left: "10%", delay: 0, dur: 7, color: "from-violet-500/40 via-purple-500/30 to-transparent" },
    { left: "30%", delay: 1.5, dur: 9, color: "from-blue-500/35 via-cyan-500/25 to-transparent" },
    { left: "50%", delay: 0.8, dur: 8, color: "from-fuchsia-500/40 via-pink-500/25 to-transparent" },
    { left: "70%", delay: 2.2, dur: 10, color: "from-indigo-500/40 via-violet-500/25 to-transparent" },
    { left: "85%", delay: 0.4, dur: 7.5, color: "from-purple-500/35 via-fuchsia-500/20 to-transparent" },
    { left: "20%", delay: 3, dur: 11, color: "from-cyan-500/30 via-blue-500/20 to-transparent" },
  ];

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        contain: "strict",
        willChange: "transform",
        transform: "translate3d(var(--beam-x, 0), var(--beam-y, 0), 0)",
        transition: "transform 0.05s linear",
      }}
    >
      {/* 顶部光束发射区 */}
      <div className="absolute inset-x-0 top-0 h-[60rem] [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]">
        {beams.map((b, i) => (
          <Beam key={i} {...b} />
        ))}
      </div>

      {/* 底部装饰网格（更暗） */}
      <div
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)] opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* 底部柔和光晕 */}
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-violet-500/5 via-purple-500/3 to-transparent" />
    </div>
  );
}

function Beam({
  left,
  delay,
  dur,
  color,
}: {
  left: string;
  delay: number;
  dur: number;
  color: string;
}) {
  return (
    <div
      className="absolute top-0 h-full w-[2px] origin-top"
      style={{ left, animationDelay: `${delay}s` }}
    >
      {/* 渐变光束（沿 path 流动） */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${color} blur-[2px]`}
        style={{
          animation: `beamFlow ${dur}s ease-in-out infinite`,
          animationDelay: `${delay}s`,
        }}
      />
      {/* 内核高亮 */}
      <div
        className="absolute inset-0 w-px"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(168,85,247,0.3), transparent)",
          animation: `beamFlow ${dur}s ease-in-out infinite`,
          animationDelay: `${delay}s`,
        }}
      />
    </div>
  );
}
