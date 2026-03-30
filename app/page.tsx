import React from 'react';
import { Banner } from '@/src/components/Banner';
import { NewsBox } from '@/src/components/NewsBox';
// 🛡️ Fixed: Importing the new component instead of the deleted one
import CaseLawBox from '@/src/components/CaseLawBox'; 
import { FarSideBox } from '@/src/components/FarSideBox';
import { ResizablePanels } from '@/src/components/ResizablePanels';
// 📊 Importing your fresh data
import allCases from '@/src/data/cases.json';

export default function HomePage() {
  // Grab the latest case (the first one in your JSON)
  const featuredCase = allCases[0];

  return (
    <main className="min-h-screen bg-[#EEEDEB]">
      <Banner />
      
      {/* Using ResizablePanels to layout your homepage. 
         We pass the featured case into the new CaseLawBox.
      */}
      <ResizablePanels 
        leftPanel={<NewsBox />}
        centerPanel={<CaseLawBox caseData={featuredCase} />}
        rightPanel={<FarSideBox />}
      />
    </main>
  );
}