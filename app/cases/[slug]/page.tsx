// ─────────────────────────────────────────────────────────────────────────────
// app/cases/[slug]/page.tsx — Atlanta Gleaner individual case law page
//
// Layout mirrors the home page exactly:
//   Banner → NavBar (from root layout) → ResizablePanels
//     Left:   NewsBox (live news feed)
//     Center: CaseLawBox (this case)
//     Right:  FarSideBox
//
// Static generation: all slugs from cases.json pre-rendered at build time.
// ─────────────────────────────────────────────────────────────────────────────

import { notFound } from 'next/navigation'
import { Banner }         from '@/src/components/Banner'
import { NewsBox }        from '@/src/components/NewsBox'
import CaseLawBox         from '@/src/components/CaseLawBox'
import { FarSideBox }     from '@/src/components/FarSideBox'
import { ResizablePanels } from '@/src/components/ResizablePanels'
import casesRaw           from '@/src/data/cases.json'
import type { CaseLaw }   from '@/src/data/types'

const cases = casesRaw as CaseLaw[]

// ── Static params (build-time pre-rendering) ─────────────────────────────────

export async function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }))
}

// ── Per-page metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const c = cases.find((x) => x.slug === params.slug)
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

export default function CaseLawPage({ params }: { params: { slug: string } }) {
  const caseData = cases.find((c) => c.slug === params.slug)
  if (!caseData) notFound()

  return (
    <main className="min-h-screen bg-[#EEEDEB]">
      <Banner />
      <ResizablePanels
        left={{
          label: 'Latest News',
          node:  <NewsBox />,
        }}
        center={{
          label: 'Opinion',
          node:  <CaseLawBox caseData={caseData!} label="Opinion" />,
        }}
        right={{
          label: 'The Far Side',
          node:  <FarSideBox />,
        }}
      />
    </main>
  )
}
