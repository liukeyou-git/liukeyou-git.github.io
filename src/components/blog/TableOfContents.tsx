'use client';

import { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const articleHeadings = document.querySelectorAll('article h2, article h3');
    const newHeadings: Heading[] = [];
    
    articleHeadings.forEach((heading) => {
      const id = heading.id || heading.textContent?.replace(/\s+/g, '-').toLowerCase() || '';
      if (!heading.id && id) {
        heading.id = id;
      }
      newHeadings.push({
        id: heading.id || '',
        text: heading.textContent || '',
        level: parseInt(heading.tagName[1]) as 2 | 3,
      });
    });
    
    setHeadings(newHeadings);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { threshold: 0.2, rootMargin: '-100px 0px -50% 0px' }
    );

    articleHeadings.forEach((heading) => {
      observer.observe(heading);
    });

    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <aside className="fixed right-6 top-24 w-64 hidden xl:block z-40">
      <div className="glass rounded-xl p-4">
        <h4 className="text-sm font-semibold text-text-primary mb-3">目录</h4>
        <nav className="space-y-1">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={`block text-xs transition-colors ${
                activeId === heading.id
                  ? 'text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              } ${heading.level === 3 ? 'pl-4' : ''}`}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}