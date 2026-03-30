import React from 'react';

// --- 📘 THE BLUEPRINT (TypeScript Interface) ---
// This tells Cursor exactly what data makes up a single case.
export interface CaseData {
  title: string;
  court: string;
  dateDecided: string;
  docketNo: string;
  citations: string;
  judges: string;
  disposition: string;
  summary: string;
  priorHistory?: string; // The "?" means this is optional (some cases might not have it)
  counsel?: string;
  opinionBody: string;
  footnotes?: { id: number; rawText: string }[];
}

// --- 🧹 THE CLEANING ROBOTS ---
const cleanOpinionText = (rawText: string) => {
  return rawText.replace(/\[\*{2,3}\d+\]/g, '');
};

const cleanFootnoteText = (rawFootnote: string) => {
  return rawFootnote.replace(/^\d+\.\s*\d*\s*/, '').replace(/\s*↑?$/, '');
};

// --- 🏗️ THE MAIN COMPONENT ---
// We now pass 'caseData' into the component so it dynamically fills in the blanks.
export default function CaseLawBox({ caseData }: { caseData: CaseData }) {
  
  // If no data is passed in somehow, don't crash the page.
  if (!caseData) return null;

  return (
    <article className="w-full max-w-[1600px] text-[#000000]">
      
      {/* 1. CASE TITLE HEADER */}
      <header className="bg-[#FFFFFF] pb-4 mb-4 border-b border-[#000000]">
        <h1 className="font-serif text-4xl md:text-5xl leading-tight">
          {caseData.title}
        </h1>
      </header>

      {/* 2. METADATA BLOCK */}
      <section className="bg-[#EEEDEB] p-6 text-[10px] font-sans leading-relaxed">
        <div className="grid grid-cols-[120px_1fr] gap-y-3 mb-6">
          <span className="uppercase tracking-wide font-medium">Court:</span>
          <span>{caseData.court}</span>

          <span className="uppercase tracking-wide font-medium">Date Decided:</span>
          <span>{caseData.dateDecided}</span>

          <span className="uppercase tracking-wide font-medium">Docket No:</span>
          <span>{caseData.docketNo}</span>

          <span className="uppercase tracking-wide font-medium">Citations:</span>
          <span>{caseData.citations}</span>

          <span className="uppercase tracking-wide font-medium">Judges:</span>
          <span>{caseData.judges}</span>

          <span className="uppercase tracking-wide font-medium">Disposition:</span>
          <span>{caseData.disposition}</span>
        </div>
        
        {/* The Notice Line */}
        <div className="pt-3">
          <p><span className="font-bold">Notice:</span> THIS OPINION IS UNCORRECTED AND SUBJECT TO REVISION.</p>
        </div>
      </section>

      {/* 3. SEPARATOR */}
      <div className="h-[12px] bg-transparent"></div>

      {/* 4. EDITORIAL BLOCK */}
      <section className="bg-[#EEEDEB] p-6 font-sans">
        <h2 className="text-[10px] uppercase font-bold mb-2">Case Summary:</h2>
        <p className="text-[14px]">
          {caseData.summary}
        </p>
      </section>

      {/* 5. OPINION BLOCK */}
      <section className="bg-[#FFFFFF] p-6 font-sans border-t border-[#000000]">
        
        {/* Only show this block if prior history or counsel actually exists for this case */}
        {(caseData.priorHistory || caseData.counsel) && (
          <div className="mb-8 space-y-2 text-[10px]">
            {caseData.priorHistory && (
              <p><span className="uppercase font-bold">Prior History:</span> {caseData.priorHistory}</p>
            )}
            {caseData.counsel && (
              <p><span className="uppercase font-bold">Counsel:</span> {caseData.counsel}</p>
            )}
          </div>
        )}

        {/* The cleaned-up main reading text */}
        <div className="space-y-4 text-[14px] font-medium leading-relaxed mb-12">
          <p>
            {cleanOpinionText(caseData.opinionBody)} 
          </p>
        </div>

        {/* Footnotes */}
        {caseData.footnotes && caseData.footnotes.length > 0 && (
          <div className="pt-6 border-t border-[#000000] text-[10px] leading-relaxed">
            <ol className="space-y-3">
              {caseData.footnotes.map((fn) => (
                <li key={fn.id} id={`fn-${fn.id}`} className="flex gap-2">
                  <a href={`#ref-${fn.id}`} className="font-bold hover:underline shrink-0">
                    {fn.id}.
                  </a>
                  <span>{cleanFootnoteText(fn.rawText)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

    </article>
  );
}