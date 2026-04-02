// ─────────────────────────────────────────────────────────────────────────────
// app/cases/[slug]/page.tsx — Atlanta Gleaner individual case law page
//
// Layout mirrors the home page exactly:
//   Banner → NavBar (from root layout) → ResizablePanels
//     Left:   NewsBox (live news feed)
//     Center: CaseLawBox (this case)
//     Right:  AstrologyBox
//
// Next.js 15+ note: `params` is a Promise — must be awaited in both
// generateMetadata and the page component.
// ─────────────────────────────────────────────────────────────────────────────

import { notFound } from 'next/navigation'
import { PALETTE }         from '@/src/styles/tokens'
import { Banner }          from '@/src/components/Banner'
import { NewsBox }         from '@/src/components/NewsBox'
import CaseLawBox          from '@/src/components/CaseLawBox'
import { AstrologyBox }    from '@/src/components/AstrologyBox'
import { ResizablePanels } from '@/src/components/ResizablePanels'
import casesRaw            from '@/src/data/cases.json'
import type { CaseLaw }    from '@/src/data/types'

const cases = casesRaw as CaseLaw[]

// Prevent 404s for slugs not in generateStaticParams at runtime
export const dynamicParams = false

// ── Static params (build-time pre-rendering) ─────────────────────────────────

export async function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }))
}

// ── Per-page metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const c = cases.find((x) => x.slug === slug)
  if (!c) return {}
  return {
    title:       `${c.title} — The Atlanta Gleaner`,
    description: c.summary && c.summary !== 'Summary pending.'
      ? c.summary
      : `${c.court} · ${c.dateDecided}`,
    openGraph: {
      title:       c.title,
      description: c.court,
      type:        'article',
    },
  }
}

// ── Page component ────────────────────────────────────────────────────────────

export default async function CaseLawPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const caseData = cases.find((c) => c.slug === slug)
  if (!caseData) notFound()

  return (
    <main style={{ minHeight: '100vh', background: PALETTE.warm }}>
      <Banner />
      <ResizablePanels
        left={{
          label: 'Latest News',
          node:  <NewsBox />,
        }}
        center={{
          label: 'Case Law Updates',
          node:  <CaseLawBox caseData={caseData!} />,
        }}
        right={{
          label: 'Astrology',
          node:  <AstrologyBox />,
        }}
      />
    </main>
  )
}
