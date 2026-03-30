import { promises as fs } from 'fs';
import path from 'path';
import { Banner } from '@/src/components/Banner';
import { NewsBox } from '@/src/components/NewsBox';
import { DynamicCaseLawBox } from '@/src/components/DynamicCaseLawBox';
import { FarSideBox } from '@/src/components/FarSideBox';
import { ResizablePanels } from '@/src/components/ResizablePanels';

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // 1. Load the "Brain" to find the metadata
  const indexPath = path.join(process.cwd(), 'public', 'search-index.json');
  const index = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
  const current = index.find((c: any) => c.id === slug);

  // 2. Load the actual HTML opinion
  const htmlPath = path.join(process.cwd(), 'public', 'cases-data', `${slug}.html`);
  const html = await fs.readFile(htmlPath, 'utf-8');

  return (
    <>
      <Banner />
      <div style={{ paddingTop: '24px' }}>
        <ResizablePanels
          left={{ 
            label: 'Roll-A · News', 
            node: <NewsBox key="news" /> 
          }}
          center={{ 
            label: `Roll-B · Case Law: ${current?.title?.toUpperCase() || slug.toUpperCase()}`, 
            node: <DynamicCaseLawBox key="case" caseMeta={current} htmlContent={html} /> 
          }}
          right={{ 
            label: 'Roll-C · The Far Side', 
            node: <FarSideBox key="farside" /> 
          }}
        />
      </div>
    </>
  );
}