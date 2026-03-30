import React from 'react';
import { notFound } from 'next/navigation';
import CaseLawBox from '@/components/CaseLawBox'; 
import allCases from '@/src/data/cases.json'; 

interface Props {
  params: { slug: string };
}

// 1. This tells Vercel exactly which 133 pages to build
export async function generateStaticParams() {
  return allCases.map((c: any) => ({
    slug: c.slug,
  }));
}

export default function CasePage({ params }: Props) {
  // 2. Find the case
  const currentCase = allCases.find((c: any) => c.slug === params.slug);

  if (!currentCase) {
    notFound();
  }

  return (
    <main className="flex flex-col items-center py-10 px-4 min-h-screen bg-[#EEEDEB]">
      {/* 3. The established CaseLawBox layout */}
      <CaseLawBox caseData={currentCase} />
    </main>
  );
}