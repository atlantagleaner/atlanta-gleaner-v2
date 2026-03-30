import { promises as fs } from 'fs';
import path from 'path';

// Import your standard autonomous modules
import { Banner } from '@/src/components/Banner';
import { NewsBox } from '@/src/components/NewsBox';
import { FarSideBox } from '@/src/components/FarSideBox';
import { ResizablePanels } from '@/src/components/ResizablePanels';

// In the new Next.js, params is a Promise that we must 'await'
export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  
  // 1. Await the params to get the slug correctly
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // 2. Find the generated HTML file in the public folder
  const filePath = path.join(process.cwd(), 'public', 'cases-data', `${slug}.html`);
  
  // (I removed the try/catch block for now. If there's a typo, I want it to give us 
  // a real error message on the screen instead of hiding it behind a generic 404!)
  const caseHtml = await fs.readFile(filePath, 'utf-8');

  // 3. Create the center module content
  const CaseContent = (
    <div className="h-full w-full overflow-y-auto bg-white p-6 text-black">
      <div dangerouslySetInnerHTML={{ __html: caseHtml }} className="prose max-w-none" />
    </div>
  );

  // 4. Return the layout
  return (
    <>
      <Banner />
      <div style={{ paddingTop: '24px' }}>
        <ResizablePanels
          left={{
            label: 'Roll-A · News',
            node: <NewsBox />,
          }}
          center={{
            label: `Roll-B · Case Law: ${slug.replace(/-/g, ' ').toUpperCase()}`,
            node: CaseContent,
          }}
          right={{
            label: 'Roll-C · The Far Side',
            node: <FarSideBox />,
          }}
        />
      </div>
    </>
  );
}