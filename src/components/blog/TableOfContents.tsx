'use client';

import { useEffect, useState } from 'react';

interface Heading {
  depth: number;
  slug: string;
  text: string;
}

interface Props {
  headings: Heading[];
}

export default function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    for (const h of headings) {
      const el = document.getElementById(h.slug);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav class="hidden lg:block fixed left-[max(2rem,calc((100vw-65ch-24rem)/2))] top-28 w-56 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
        On this page
      </h3>
      <ul class="space-y-1.5 border-l border-white/10">
        {headings.map((h) => (
          <li>
            <a
              href={`#${h.slug}`}
              class={`block text-sm py-0.5 transition-colors ${
                activeId === h.slug
                  ? 'text-accent-hover border-l-2 border-accent -ml-px pl-[calc(0.5rem-1px)]'
                  : 'text-text-secondary hover:text-text-primary pl-2'
              }`}
              style={{ paddingLeft: h.depth > 2 ? `${(h.depth - 1) * 0.75}rem` : undefined }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
