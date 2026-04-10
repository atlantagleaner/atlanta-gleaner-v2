'use client'

import EventHorizonScene from '@/src/components/EventHorizonScene'
import OrbitalControls from '@/src/components/OrbitalControls'

// Videos for the orbital scene
const ORBITAL_VIDEOS = [
  {
    id: 'video0',
    title: 'Track 1',
    youtubeId: '-l6wrTvMcbY',
    angle: 0
  },
  {
    id: 'video1',
    title: 'Track 2',
    youtubeId: 'jtTjzDTpx8o',
    angle: 60
  },
  {
    id: 'video2',
    title: 'Track 3',
    youtubeId: 'Tg9cN2A7-cA',
    angle: 120
  },
  {
    id: 'video3',
    title: 'Track 4',
    youtubeId: '_GT9SmA1vlI',
    angle: 180
  },
  {
    id: 'video4',
    title: 'Track 5',
    youtubeId: '-W20dfeNCmI',
    angle: 240
  },
  {
    id: 'video5',
    title: 'Track 6',
    youtubeId: '9Y4wk-J3x7w',
    angle: 300
  }
]

export default function OrbitalPage() {
  const handleVideoSelect = (videoId: string) => {
    const event = new CustomEvent('flyTo', { detail: { targetId: videoId } })
    document.dispatchEvent(event)
  }

  return (
    <>
      <div style={{
        flex: 1,
        width: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <EventHorizonScene videos={ORBITAL_VIDEOS} showTitles={true} onVideoSelect={handleVideoSelect} />
      </div>
      <OrbitalControls videos={ORBITAL_VIDEOS} onVideoSelect={handleVideoSelect} />
    </>
  )
}
