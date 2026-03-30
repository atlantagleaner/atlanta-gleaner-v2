import React from 'react';

export interface CaseData {
  slug: string;
  noticeBanner?: string;
  metadata: {
    title: string;
    court: string;
    dateDecided: string;
    docketNo: string;
    citations: string;
  };
  holding: string;
  opinionAuthor: string;
  opinionBody: string;
  footnotes: Array<{ marker: string; content: string }>;
  summary: string;
}

interface Props {
  caseData: CaseData;
}

const CaseLawBox: React.FC<Props> = ({ caseData }) => {
  if (!caseData) return null;

  return (
    <article className="p-8 bg-white shadow-sm border border-black max-w-4xl mx-auto">
      {caseData.noticeBanner && (
        <div className="notice-banner">{caseData.noticeBanner}</div>
      )}

      <h1 className="font-serif text-4xl font-bold mb-8 leading-tight">
        {caseData.metadata.title}
      </h1>

      <div className="metadata-grid">
        <span className="metadata-label">Court</span>
        <span className="metadata-value">{caseData.metadata.court}</span>
        <span className="metadata-label">Docket</span>
        <span className="metadata-value">{caseData.metadata.docketNo}</span>
        <span className="metadata-label">Decided</span>
        <span className="metadata-value">{caseData.metadata.dateDecided}</span>
        <span className="metadata-label">Citation</span>
        <span className="metadata-value">{caseData.metadata.citations}</span>
      </div>

      <div className="holding-block italic">
        {caseData.holding}
      </div>

      <div className="opinion-container">
        {caseData.opinionAuthor && (
          <span className="opinion-author">Opinion by {caseData.opinionAuthor}</span>
        )}
        <div
          className="opinion-body"
          dangerouslySetInnerHTML={{ __html: caseData.opinionBody }}
        />
      </div>

      {caseData.footnotes.length > 0 && (
        <footer className="footnote-list">
          {caseData.footnotes.map((fn) => (
            <div key={fn.marker} className="footnote-item">
              <span className="footnote-marker">{fn.marker}</span>
              <div className="footnote-content">{fn.content}</div>
            </div>
          ))}
        </footer>
      )}
    </article>
  );
};

export default CaseLawBox;
