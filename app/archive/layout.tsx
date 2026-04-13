import { Providers } from '@/src/components/Providers'
import { AnalogShell } from '@/src/components/AnalogShell'

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AnalogShell>
        {children}
      </AnalogShell>
    </Providers>
  )
}
