'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — NewsBox Component (Live RSS Edition)
// Architecture: Autonomous Module. Self-contained design spec; does not
// inherit from global tokens to ensure cross-page identity consistency.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

// ── Design system tokens (matching existing lib/styles) ─────────────────────────────
const E6 = { white: '#FFFFFF', warm: '#EEEDEB', black: '#000000' };
const T = {
  micro: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
  },
  label: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.16em',
  },
  body: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.45,
  },
};
const N7 = {
  border: '1px solid rgba(0,0,0,0.18)',
  background: '#FFFFFF',
  height: 'fit-content',
  display: 'flex',
  flexDirection: 'column' as const,
};
const AO = {
  ...T.label,
  color: '#000000',
  borderBottom: '2px solid #000000',
  paddingBottom: '7px',
  margin: '0 0 14px 0',
};
const Ne = { borderBottom: '1px solid rgba(0,0,0,0.07)' };
const eQ = '16px 14px';

// ── Types ───────────────────────────────────────────────────────────────────────

interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  score: number;
  slot: string;
}

// ── Slot type badges ────────────────────────────────────────────────────────────

const SLOT_BADGE: Record<string, { label: string; color: string } | null> = {
  science_pin: { label: '▶', color: '#000000' },
  science_nova: { label: '◉', color: '#000000' },
  letterman: { label: '★', color: '#000000' },
  news: null,
};

// ── Individual news item ────────────────────────────────────────────────────────

function NewsItemRow({ item }: { item: NewsItem }) {
  const [hovered, setHovered] = useState(false);
  const badge = SLOT_BADGE[item.slot] || null;

  return (
    <li style={{ ...Ne, paddingBottom: '10px', marginBottom: '10px' }}>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ textDecoration: 'none', display: 'block' }}
      >
        <p
          style={{
            ...T.body,
            color: hovered ? E6.white : E6.black,
            backgroundColor: hovered ? E6.black : 'transparent',
            padding: hovered ? '2px 4px' : '2px 0',
            textDecoration: 'none',
            transition: 'all 0.1s',
            margin: 0,
          }}
        >
          {badge && (
            <span
              style={{
                ...T.micro,
                color: hovered ? E6.white : badge.color,
                marginRight: '5px',
                fontSize: '8px',
                verticalAlign: 'middle',
              }}
            >
              {badge.label}
            </span>
          )}
          {item.title}
        </p>
        <p style={{ ...T.micro, color: E6.black, marginTop: '5px', marginBottom: 0 }}>
          {item.source}
        </p>
      </a>
    </li>
  );
}

// ── Loading skeleton ────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} style={{ ...Ne, paddingBottom: '10px', marginBottom: '10px' }}>
          <div style={{ height: '14px', width: `${60 + (i % 3) * 15}%`, background: 'rgba(0,0,0,0.07)', marginBottom: '6px' }} />
          <div style={{ height: '10px', width: '30%', background: 'rgba(0,0,0,0.05)' }} />
        </li>
      ))}
    </ul>
  );
}

// ── Main NewsBox component ─────────────────────────────────────────────────────────

export function NewsBox({ style }: { style?: React.CSSProperties }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/news');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setItems(data.items || []);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('[NewsBox] fetch error:', err);
        if (!cancelled) {
          setError('News unavailable');
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ height: 'fit-content', ...style }}>
      <div style={N7}>
        <div style={{ padding: eQ, overflowY: 'auto' }}>
          <h2 style={AO}>News Index</h2>

          {loading && <LoadingSkeleton />}

          {error && !loading && (
            <p style={{ ...T.micro, color: E6.black, margin: 0 }}>{error}</p>
          )}

          {!loading && !error && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {items.map((item, i) => (
                <NewsItemRow key={item.url || i} item={item} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewsBox;
