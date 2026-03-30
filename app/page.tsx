import { promises as fs } from 'fs';
import path from 'path';
import { Banner } from '@/src/components/Banner';
import { NewsBox } from '@/src/components/NewsBox';
import { DynamicCaseLawBox } from '@/src/components/DynamicCaseLawBox';
import { FarSideBox } from '@/src/components/FarSideBox';
import { ResizablePanels } from '@/src/components/ResizablePanels';

export default async function HomePage() {
  const index = JSON.parse(await fs.readFile(path.join(process.cwd(), 'public', 'search-index.json'), 'utf-8'));
  const newest = index[0]; // Logic: Top of the list is latest
  const html = await fs.readFile(path.join(process.cwd(), 'public', 'cases-data', `${newest.id}.html`), 'utf-8');

  return (
    <>
      <Banner />
      <div style={{ paddingTop: '24px' }}>
        <ResizablePanels
          left={{ label: 'Roll-A · News', node: <NewsBox key="news" /> }}
          center={{ 
            label: `Roll-B · Latest Case: ${newest.title.toUpperCase()}`, 
            node: <DynamicCaseLawBox key="case" htmlContent={html} slugTitle={newest.id} /> 
          }}
          right={{ label: 'Roll-C · The Far Side', node: <FarSideBox key="farside" /> }}
        />
      </div>
    </>
  );
}