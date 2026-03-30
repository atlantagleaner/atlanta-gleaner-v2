import React from 'react';

// --- 📘 THE BLUEPRINT (TypeScript Interface) ---
export interface CaseData {
  slug?: string;
  title: string;
  court: string;
  dateDecided: string;
  docketNo: string;
  citations: string;
  judges?: string;
  opinionBy?: string;
  disposition?: string;
  summary: string;
  priorHistory?: string; 
  counsel?: string;
  opinionBody: string;
  footnotes?: { id: number; rawText: string }[];
}

// --- 🏗️ THE MAIN COMPONENT ---
export default function CaseLawBox({ caseData }: { caseData: CaseData }) {
  
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

          {caseData.judges && (
            <>
              <span className="uppercase tracking-wide font-medium">Judges:</span>
              <span>{caseData.judges}</span>
            </>
          )}

          {caseData.disposition && (
            <>
              <span className="uppercase tracking-wide font-medium">Disposition:</span>
              <span>{caseData.disposition}</span>
            </>
          )}
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
        
        {/* Only show this block if prior history or counsel actually exists */}
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

        {caseData.opinionBy && (
          <p className="font-bold text-[14px] mb-4 uppercase">Opinion by: {caseData.opinionBy}</p>
        )}

        {/* --- 🪄 HTML INJECTION FOR FORMATTING --- */}
        {/* We use dangerouslySetInnerHTML to render the rich formatting (bold, italics) from LexisNexis */}
        <div 
          className="space-y-4 text-[14px] font-medium leading-relaxed mb-12"
          dangerouslySetInnerHTML={{ __html: caseData.opinionBody }}
        />

        {/* Footnotes */}
        {caseData.footnotes && caseData.footnotes.length > 0 && (
          <div className="pt-6 border-t border-[#000000] text-[10px] leading-relaxed">
            <ol className="space-y-3">
              {caseData.footnotes.map((fn) => (
                <li key={fn.id} id={`fn-${fn.id}`} className="flex gap-2">
                  <a href={`#ref-${fn.id}`} className="font-bold hover:underline shrink-0 text-blue-600">
                    {fn.id}.
                  </a>
                  <span>{fn.rawText}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

    </article>
  );
}