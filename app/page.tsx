import { Banner } from '@/src/components/Banner';
import { NewsBox } from '@/src/components/NewsBox';
import { CaseLawBox } from '@/src/components/CaseLawBox';
import { FarSideBox } from '@/src/components/FarSideBox';
import { ResizablePanels } from '@/src/components/ResizablePanels';

export default function HomePage() {
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
            label: 'Roll-B · Case Law',
            node: <CaseLawBox key="case" />,
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