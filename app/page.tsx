import { promises as fs } from 'fs';
import path from 'path';
import { Banner } from '@/src/components/Banner';
import { NewsBox } from '@/src/components/NewsBox';
import { DynamicCaseLawBox } from '@/src/components/DynamicCaseLawBox';
import { FarSideBox } from '@/src/components/FarSideBox';
import { ResizablePanels } from '@/src/components/ResizablePanels';

export default async function HomePage() {
  // 1. Grab the latest entry from the index
  const indexPath = path.join(process.cwd(), 'public', 'search-index.json');
  const index = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
  const newest = index[0]; 

  // 2. Load the HTML for that specific latest case
  const htmlPath = path.join(process.cwd(), 'public', 'cases-data', `${newest.id}.html`);
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
            label: `Roll-B · Latest Case: ${newest?.title?.toUpperCase() || 'LATEST'}`, 
            node: <DynamicCaseLawBox key="case" caseMeta={newest} htmlContent={html} /> 
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