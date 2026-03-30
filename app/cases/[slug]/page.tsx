import React from 'react';
import { notFound } from 'next/navigation';
// Fixed paths to include 'src'
import CaseLawBox from '@/src/components/CaseLawBox'; 
import allCases from '@/src/data/cases.json'; 

interface Props {
  params: { slug: string };
}

// Pre-builds all 133 pages for speed
export async function generateStaticParams() {
  return allCases.map((c: any) => ({
    slug: c.slug,
  }));
}

export default function CasePage({ params }: Props) {
  // Find the case in our JSON library
  const currentCase = allCases.find((c: any) => c.slug === params.slug);

  if (!currentCase) {
    notFound();
  }

  return (
    <main className="flex flex-col items-center py-10 px-4 min-h-screen bg-[#EEEDEB]">
      <CaseLawBox caseData={currentCase} />
    </main>
  );
}