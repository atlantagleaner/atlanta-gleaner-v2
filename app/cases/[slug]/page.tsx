// app/opinions/[slug]/page.tsx
import cases from '@/data/cases.json';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return cases.map((c) => ({
    slug: c.slug,
  }));
}

export default function CaseLawPage({ params }: { params: { slug: string } }) {
  const caseData = cases.find((c) => c.slug === params.slug);

  if (!caseData) notFound();

  return (
    <article className="case-law-article">
      {/* Fidelity Rule #4: Notice Banner */}
      {caseData.noticeBanner && (
        <div className="notice-banner">{caseData.noticeBanner}</div>
      )}

      <header className="case-header">
        <h1 className="case-title">{caseData.metadata.title}</h1>
      </header>

      {/* Metadata Grid */}
      <section className="case-metadata">
        <div className="metadata-grid">
          <span className="metadata-label">Court</span>
          <span className="metadata-value">{caseData.metadata.court}</span>
          
          <span className="metadata-label">Docket No.</span>
          <span className="metadata-value">{caseData.metadata.docketNo}</span>
          
          <span className="metadata-label">Decided</span>
          <span className="metadata-value">{caseData.metadata.dateDecided}</span>
          
          <span className="metadata-label">Citation</span>
          <span className="metadata-value">{caseData.metadata.citations}</span>
        </div>
      </section>

      {/* Editorial Summary Box */}
      <section className="case-summary-box">
        <h2 className="summary-title">Editorial Summary</h2>
        <p className="summary-text">{caseData.summary}</p>
      </section>

      {/* The Holding Block */}
      <div className="holding-block">
        {caseData.holding}
      </div>

      {/* Verbatim Opinion Body */}
      <div className="opinion-container">
        {caseData.opinionAuthor && (
          <div className="opinion-author">Opinion by: {caseData.opinionAuthor}</div>
        )}
        <div 
          className="opinion-body"
          dangerouslySetInnerHTML={{ __html: caseData.opinionBody }} 
        />
      </div>

      {/* Fidelity Rule #3: Footnotes */}
      {caseData.footnotes.length > 0 && (
        <footer className="footnote-list">
          {caseData.footnotes.map((fn: any) => (
            <div key={fn.marker} className="footnote-item" id={`footnote-${fn.marker}`}>
              <span className="footnote-marker">{fn.marker}</span>
              <div className="footnote-content">{fn.content}</div>
            </div>
          ))}
        </footer>
      )}
    </article>
  );
}