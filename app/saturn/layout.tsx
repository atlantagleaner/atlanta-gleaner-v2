import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Saturn | Atlanta Gleaner',
  description: 'A celestial archive of divinations and games of chance.',
}

export default function SaturnLayout({ children }: { children: React.ReactNode }) {
  return children
}
