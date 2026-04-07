import type { Metadata } from 'next'
import './globals.css'
import { NavBar } from '@/src/components/NavBar'
import { AnalogShell } from '@/src/components/AnalogShell'
import { serif, sans, mono } from '@/src/styles/fonts'

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
      <body className={`${serif.variable} ${sans.variable} ${mono.variable}`} style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <NavBar />
        <AnalogShell>
          {children}
        </AnalogShell>
      </body>
    </html>
  )
}
