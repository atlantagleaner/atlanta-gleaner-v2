import React from 'react';

export interface CaseData {
  slug: string;
  noticeBanner?: string; // Captures Rule #4 notices
  metadata: {
    title: string;
    court: string;
    dateDecided: string;
    docketNo: string;
    citations: string;
    judges?: string;
  };
  holding: string;
  opinionAuthor: string;
  opinionBody: string;
  summary: string;
  footnotes: Array<{ marker: string; content: string }>;
}

export default function CaseLawBox({ caseData }: { caseData: CaseData }) {
  if (!caseData) return null;

  return (
    <article className="w-full max-w-[1600px] bg-white border border-black/10 shadow-sm mx-auto">
      
      {/* 1. THE NOTICE BANNER (Rule #4) */}
      {caseData.noticeBanner && (
        <div className="notice-banner">
          {caseData.noticeBanner}
        </div>
      )}

      {/* 2. THE HEADER (Outside the Grid) */}
      <header className="px-10 py-12 bg-white">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] border-b-2 border-black pb-2 mb-8 inline-block">
          Featured Opinion
        </div>
        <h1 className="case-title">
          {caseData.metadata.title}
        </h1>
      </header>

      {/* 3. THE METADATA GRID (Warm Surface) */}
      <section className="metadata-grid px-10 py-10 bg-[#EEEDEB]">
        <span className="metadata-label">Court</span>
        <span className="metadata-value">{caseData.metadata.court}</span>

        <span className="metadata-label">Docket No</span>
        <span className="metadata-value">{caseData.metadata.docketNo}</span>

        <span className="metadata-label">Decided</span>
        <span className="metadata-value">{caseData.metadata.dateDecided}</span>

        <span className="metadata-label">Citations</span>
        <span className="metadata-value">{caseData.metadata.citations}</span>

        {caseData.metadata.judges && (
          <>
            <span className="metadata-label">Judges</span>
            <span className="metadata-value">{caseData.metadata.judges}</span>
          </>
        )}
      </section>

      {/* 4. THE EDITORIAL BLOCK */}
      <section className="px-10 py-12 bg-[#EEEDEB] border-t border-black/5">
        <div className="max-w-3xl">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4">Case Summary</h2>
          <p className="font-sans text-[14px] leading-[1.65] mb-8">
            {caseData.summary}
          </p>
          <div className="holding-block">
            {caseData.holding}
          </div>
        </div>
      </section>

      {/* 5. THE OPINION SECTION (White Surface) */}
      <section className="px-10 py-16 bg-white border-t border-black">
        <h2 className="font-serif text-2xl font-bold mb-6">Opinion</h2>
        
        {caseData.opinionAuthor && (
          <span className="opinion-author">
            Opinion by {caseData.opinionAuthor}
          </span>
        )}

        <div 
          className="opinion-body"
          dangerouslySetInnerHTML={{ __html: caseData.opinionBody }} 
        />

        {/* 6. FOOTNOTES (Rule #3) */}
        {caseData.footnotes && caseData.footnotes.length > 0 && (
          <footer className="footnote-list">
            {caseData.footnotes.map((fn) => (
              <div key={fn.marker} className="footnote-item" id={`fn-${fn.marker}`}>
                <span className="footnote-marker">[{fn.marker}]</span>
                <div className="footnote-content">{fn.content}</div>
              </div>
            ))}
          </footer>
        )}
      </section>

    </article>
  );
}
