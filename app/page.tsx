import React from 'react';
import { Banner } from '@/src/components/Banner';
import { NewsBox } from '@/src/components/NewsBox';
import CaseLawBox, { CaseData } from '@/src/components/CaseLawBox';
import { FarSideBox } from '@/src/components/FarSideBox';
import { ResizablePanels } from '@/src/components/ResizablePanels';
import { CASES } from '@/src/data/cases';
import type { CaseLaw } from '@/src/data/types';

// Transform CaseLaw data format to CaseData format expected by CaseLawBox
const transformCaseData = (caseLaw: CaseLaw): CaseData => ({
  slug: caseLaw.slug,
  noticeBanner: caseLaw.noticeText,
  metadata: {
    title: caseLaw.title,
    court: caseLaw.court,
    dateDecided: caseLaw.dateDecided,
    docketNo: caseLaw.docketNumber,
    citations: caseLaw.citations,
    judges: caseLaw.judges,
  },
  holding: caseLaw.holdingBold,
  opinionAuthor: caseLaw.opinionAuthor,
  opinionBody: caseLaw.opinionText,
  summary: caseLaw.summary,
  footnotes: Object.entries(caseLaw.footnotes ?? {}).map(([marker, content]) => ({
    marker,
    content,
  })),
});

const cases: CaseData[] = CASES.map(transformCaseData);

export default function HomePage() {
  // Sort cases by dateDecided (newest first)
  // before picking the featured case
  const sortedCases = [...cases].sort(
    (a, b) =>
      new Date(b.metadata.dateDecided).getTime() -
      new Date(a.metadata.dateDecided).getTime()
  );

  const featuredCase = sortedCases[0];

  return (
    <main className="min-h-screen bg-[#EEEDEB]">
      <Banner />
      
      {/* ResizablePanels requires 'left', 'center', and 'right' props.
          Each must be an object with { label: string, node: ReactNode }
      */}
      <ResizablePanels 
        left={{
          label: "Latest News",
          node: <NewsBox />
        }}
        center={{
          label: "Featured Opinion",
          node: <CaseLawBox caseData={featuredCase} />
        }}
        right={{
          label: "Georgia Legal",
          node: <FarSideBox />
        }}
      />
    </main>
  );
}