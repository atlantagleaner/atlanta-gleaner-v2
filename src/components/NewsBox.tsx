'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — NewsBox Component (Serper Search Edition)
// ─────────────────────────────────────────────────────────────────────────────
// Fetches live news via Serper, served from Edge Config cache (refreshed daily).
// Includes intelligent slot-based scoring and multi-source aggregation.

import { useState, useEffect } from 'react';
import {
  PALETTE, T, BOX_SHELL, BOX_HEADER, BOX_PADDING, ITEM_RULE, SPACING, ANIMATION,
} from '@/src/styles/tokens';

// ── Types ───────────────────────────────────────────────────────────────────────

interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  score: number;
  slot: string;
  type?: 'video' | 'text';
}

// ── Slot type badges ────────────────────────────────────────────────────────────

const SLOT_BADGE: Record<string, { label: string } | null> = {
  science_pin:      { label: '▶' },
  science_nova:     { label: '◉' },
  letterman:        { label: '★' },
  news:             null,
  'news-international': null,
};

// ── Individual news item ────────────────────────────────────────────────────────

function NewsItemRow({ item }: { item: NewsItem }) {
  const [hovered, setHovered] = useState(false);
  const badge = SLOT_BADGE[item.slot] || null;

  // Determine media label (Spotify or YouTube)
  const isSpotify = item.url.includes('spotify.com');
  const isYouTube = item.type === 'video' || item.url.includes('youtube.com');

  let mediaLabel = '';
  if (isSpotify) mediaLabel = ' • Spotify';
  else if (isYouTube) mediaLabel = ' • YouTube';

  return (
    <li style={{ ...ITEM_RULE, paddingBottom: SPACING.md, marginBottom: SPACING.md }}>
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
            color:           hovered ? 'var(--interactive-hover-text)' : PALETTE.black,
            backgroundColor: hovered ? 'var(--interactive-hover-bg)' : 'transparent',
            padding:         hovered ? `2px ${SPACING.xs}` : '2px 0',
            textDecoration:  'none',
            transition:      `all ${ANIMATION.fast} ${ANIMATION.ease}`,
            margin:          0,
          }}
        >
          {badge && (
            <span
              style={{
                ...T.micro,
                color:         hovered ? 'var(--interactive-hover-text)' : PALETTE.black,
                marginRight:   SPACING.xs,
                verticalAlign: 'middle',
              }}
            >
              {badge.label}
            </span>
          )}
          {item.title}
        </p>

        {/* Metadata Line */}
        <p style={{ ...T.micro, color: PALETTE.black, marginTop: SPACING.xs, marginBottom: 0 }}>
          {item.source}{mediaLabel}
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
        <li key={i} style={{ ...ITEM_RULE, paddingBottom: SPACING.md, marginBottom: SPACING.md }}>
          <div style={{ height: '14px', width: `${60 + (i % 3) * 15}%`, background: 'var(--palette-rule)', marginBottom: SPACING.sm }} />
          <div style={{ height: '10px', width: '30%', background: 'var(--palette-rule-sm)' }} />
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
      <div style={BOX_SHELL}>
        <div style={{ padding: BOX_PADDING }}>
          <h2 style={BOX_HEADER}>News Index</h2>

          {loading && <LoadingSkeleton />}

          {error && !loading && (
            <p style={{ ...T.micro, color: PALETTE.black, margin: 0 }}>{error}</p>
          )}

          {!loading && !error && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {items.map((item) => (
                <NewsItemRow key={item.url} item={item} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}