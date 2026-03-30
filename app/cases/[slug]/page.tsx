import { promises as fs } from 'fs';
import path from 'path';
import { Banner } from '@/src/components/Banner';
import { NewsBox } from '@/src/components/NewsBox';
import { DynamicCaseLawBox } from '@/src/components/DynamicCaseLawBox';
import { FarSideBox } from '@/src/components/FarSideBox';
import { ResizablePanels } from '@/src/components/ResizablePanels';

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const html = await fs.readFile(path.join(process.cwd(), 'public', 'cases-data', `${slug}.html`), 'utf-8');
  
  // Find case title from index for the label
  const index = JSON.parse(await fs.readFile(path.join(process.cwd(), 'public', 'search-index.json'), 'utf-8'));
  const current = index.find((c: any) => c.id === slug);

  return (
    <>
      <Banner />
      <div style={{ paddingTop: '24px' }}>
        <ResizablePanels
          left={{ label: 'Roll-A · News', node: <NewsBox key="news" /> }}
          center={{ 
            label: `Roll-B · Case Law: ${current?.title.toUpperCase() || slug.toUpperCase()}`, 
            node: <DynamicCaseLawBox key="case" htmlContent={html} slugTitle={slug} /> 
          }}
          right={{ label: 'Roll-C · The Far Side', node: <FarSideBox key="farside" /> }}
        />
      </div>
    </>
  );
}