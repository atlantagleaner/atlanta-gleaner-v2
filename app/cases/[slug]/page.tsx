import React from 'react';
import { notFound } from 'next/navigation';
// Import the interface alongside the component
import CaseLawBox, { CaseData } from '@/src/components/CaseLawBox'; 
import allCases from '@/src/data/cases.json'; 

interface Props {
  params: { slug: string };
}

// Tell TypeScript exactly what shape this JSON data is
const cases = allCases as CaseData[];

// Pre-builds all 133 pages for speed
export async function generateStaticParams() {
  return cases.map((c) => ({
    slug: c.slug,
  }));
}

export default function CasePage({ params }: Props) {
  // Find the case in our typed library
  const currentCase = cases.find((c) => c.slug === params.slug);

  if (!currentCase) {
    notFound();
  }

  return (
    <main className="flex flex-col items-center py-10 px-4 min-h-screen bg-[#EEEDEB]">
      <CaseLawBox caseData={currentCase} />
    </main>
  );
}