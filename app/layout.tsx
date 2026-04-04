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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
          fetchPriority="high"
        />
      </head>
      <body>
        <NavBar />
        <AnalogShell>
          {children}
        </AnalogShell>
      </body>
    </html>
  )
}
