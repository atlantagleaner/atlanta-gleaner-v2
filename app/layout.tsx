import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Atlanta Gleaner',
  description: 'Georgia case law updates and legal news.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flicker">{children}</body>
    </html>
  )
}
