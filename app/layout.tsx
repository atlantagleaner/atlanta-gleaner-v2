import type { Metadata } from 'next'
import './globals.css'
import { NavBar } from '@/src/components/NavBar'
import { AnalogShell } from '@/src/components/AnalogShell'

export const metadata: Metadata = {
  title: 'The Atlanta Gleaner',
  description: 'Georgia case law updates and legal news from Atlanta.',
  openGraph: {
    title: 'The Atlanta Gleaner',
    description: 'Georgia case law updates and legal news from Atlanta.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <AnalogShell>
          {children}
        </AnalogShell>
      </body>
    </html>
  )
}
