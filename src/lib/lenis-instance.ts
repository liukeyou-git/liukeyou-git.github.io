/**
 * Lenis 实例单例 + 统一回顶工具
 *
 * 背景：Lenis 1.x 通过 rAF 持续控制 window 滚动位置，原生 window.scrollTo
 * 会被其 rAF 循环覆盖（实测 scrollY 不变）。因此任何需要编程式滚动的组件
 * 都应走 Lenis 的 scrollTo，而非原生 window.scrollTo。
 *
 * 本模块提供：
 * - setLenis / getLenis：SmoothScroll 在 init 时注入实例
 * - scrollToTop：统一回顶入口，自动判断 Lenis 是否活跃
 */

type ScrollToOpts = {
  immediate?: boolean;
  offset?: number;
  duration?: number;
};

type LenisLike = {
  scrollTo: (
    target: number | string | HTMLElement,
    opts?: ScrollToOpts,
  ) => void;
};

let instance: LenisLike | null = null;

/** SmoothScroll 创建 Lenis 后注入；cleanup 时传 null */
export function setLenis(l: LenisLike | null): void {
  instance = l;
}

/** 获取当前 Lenis 实例（reduced-motion 下为 null） */
export function getLenis(): LenisLike | null {
  return instance;
}

/**
 * 统一回顶
 * @param reducedMotion 是否禁用动画（瞬时回顶）
 */
export function scrollToTop(reducedMotion = false): void {
  if (instance) {
    instance.scrollTo(0, { immediate: reducedMotion });
  } else {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }
}
