// ─────────────────────────────────────────────────────────────────────────────
// app/cases/[slug]/page.tsx — Atlanta Gleaner individual case law page
//
// Layout mirrors the home page exactly:
//   Banner → NavBar (from root layout) → ResizablePanels
//     Left:   NewsBox (live news feed)
//     Center: CaseLawBox (this case)
//     Right:  FarSideBox
//
// Next.js 15+ note: `params` is a Promise — must be awaited in both
// generateMetadata and the page component.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// app/cases/[slug]/page.tsx — Atlanta Gleaner individual case law page
//
// Layout mirrors the home page exactly:
//   Banner → NavBar (from root layout) → ResizablePanels
//     Left:   NewsBox (live news feed)
//     Center: CaseLawBox (this case)
//     Right:  FarSideBox
//
// Next.js 15+ note: `params` is a Promise — must be awaited in both
// generateMetadata and the page component.
// ─────────────────────────────────────────────────────────────────────────────

import { notFound } from 'next/navigation'
import { PALETTE, PAGE_BOTTOM_PADDING_DESKTOP, PAGE_BOTTOM_PADDING_MOBILE }         from '@/src/styles/tokens'
import { Banner }          from '@/src/components/Banner'
import { NewsBox }         from '@/src/components/NewsBox'
import CaseLawBox          from '@/src/components/CaseLawBox'
import { FarSideBox }      from '@/src/components/FarSideBox'
import { ResizablePanels } from '@/src/components/ResizablePanels'
import { CasePageLayout }  from '@/src/components/CasePageLayout'
import { CasePageMain }    from '@/src/components/CasePageMain'
import { ALL_CASE_SLUGS, getCaseBySlug } from '@/src/data/cases'
import type { CaseLaw }    from '@/src/data/types'

// Prevent 404s for slugs not in generateStaticParams at runtime
export const dynamicParams = false

// ── Static params (build-time pre-rendering) ─────────────────────────────────

export async function generateStaticParams() {
  return ALL_CASE_SLUGS.map((slug) => ({ slug }))
}

// ── Per-page metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const c = getCaseBySlug(slug)
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
  const caseData = getCaseBySlug(slug)
  if (!caseData) notFound()

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .ag-case-main {
            padding-bottom: ${PAGE_BOTTOM_PADDING_MOBILE};
          }
        }
        @media (min-width: 768px) {
          .ag-case-main {
            padding-bottom: ${PAGE_BOTTOM_PADDING_DESKTOP};
          }
        }
      `}</style>
      <CasePageLayout>
        <CasePageMain caseData={caseData} />
      </CasePageLayout>
    </>
  )
}
