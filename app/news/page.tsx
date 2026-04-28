import type { Metadata } from 'next'
import { NewsExperience } from '@/src/components/News/NewsExperience'

export const metadata: Metadata = {
  title: 'News Runway',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NewsPage() {
  return <NewsExperience />
}
