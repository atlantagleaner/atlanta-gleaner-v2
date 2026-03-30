import { promises as fs } from 'fs';
import path from 'path';

// This line tells the page to use your new file!
import { DynamicCaseLawBox } from '@/src/components/DynamicCaseLawBox'; 
import { Banner } from '@/src/components/Banner';
import { NewsBox } from '@/src/components/NewsBox';
import { FarSideBox } from '@/src/components/FarSideBox';
import { ResizablePanels } from '@/src/components/ResizablePanels';

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // This finds the specific HTML file for the case you clicked
  const filePath = path.join(process.cwd(), 'public', 'cases-data', `${slug}.html`);
  const caseHtml = await fs.readFile(filePath, 'utf-8');

  return (
    <>
      <Banner />
      <div style={{ paddingTop: '24px' }}>
        <ResizablePanels
          left={{
            label: 'Roll-A · News',
            node: <NewsBox key="news" />,
          }}
          center={{
            label: `Roll-B · Case Law: ${slug.replace(/-/g, ' ').toUpperCase()}`,
            // We pass the HTML into your new component here
            node: <DynamicCaseLawBox key="case" htmlContent={caseHtml} slugTitle={slug} />, 
          }}
          right={{
            label: 'Roll-C · The Far Side',
            node: <FarSideBox key="farside" />,
          }}
        />
      </div>
    </>
  );
}