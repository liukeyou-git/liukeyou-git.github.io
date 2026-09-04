import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 供 aria-labelledby 引用的标题元素 id */
  labelledBy?: string;
  /** 自定义覆盖层与容器className（一般无需传） */
  overlayClassName?: string;
  containerClassName?: string;
}

const FOCUSABLE_SELECTOR =
  ':where(a, button, input, textarea, select, [tabindex]):not([disabled]):not([tabindex="-1"])';

/**
 * 共享可访问模态
 * - Esc 关闭；Tab 焦点陷阱（首末 wrap）
 * - 打开时记录并转移焦点到容器，关闭时恢复原焦点
 * - body.overflow=hidden 防背景滚动
 * - role="dialog" aria-modal="true"
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  labelledBy,
  overlayClassName = '',
  containerClassName = '',
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = containerRef.current;

    // 聚焦容器
    if (container) {
      container.focus();
    }

    // 防背景滚动
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !container) return;

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusables.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        if (active === first || active === container) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${overlayClassName}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative w-full max-w-md bg-bg-card rounded-xl shadow-2xl border border-white/10 overflow-hidden outline-none ${containerClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
