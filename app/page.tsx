import React from 'react';
import { Banner } from '@/src/components/Banner';
import { NewsBox } from '@/src/components/NewsBox';
import CaseLawBox, { CaseData } from '@/src/components/CaseLawBox'; 
import { FarSideBox } from '@/src/components/FarSideBox';
import { ResizablePanels } from '@/src/components/ResizablePanels';
import allCases from '@/src/data/cases.json';

// Cast the JSON to our CaseData interface for total type safety
const cases = allCases as CaseData[];

export default function HomePage() {
  // Automatically grab the most recent case from your 140 opinions
  const featuredCase = cases[0];

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