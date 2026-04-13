'use client'

import React, { useState } from 'react';
import { Play, Music, ChevronRight, Volume2 } from 'lucide-react';

const artists = [
  {
    id: 'azealia-banks',
    name: 'AZEALIA BANKS RADIO',
    genre: 'HOUSE / BALLROOM',
    playlistId: 'PL4-ERQAn4mRL1aXgmMCI7HTABHPmVkTqP',
  },
  {
    id: 'the-field',
    name: 'THE FIELD RADIO',
    genre: 'MINIMAL TECHNO',
    playlistId: 'PL4-ERQAn4mRJcxMG33aQScuQmYIwEuFvS',
  },
  {
    id: 'minimal-techno',
    name: 'MINIMAL TECHNO',
    genre: 'BLUES',
    playlistId: 'PL7uGNWx-iG9YZuPa0pfuF1uSrVLCpdoKN',
  },
  {
    id: 'blues-remedy',
    name: 'BLUES REMEDY',
    genre: 'BLUES',
    playlistId: 'PL4-ERQAn4mRJEE6DTaigv_JWQ7Anbx9Cu',
  }
];

interface RadioHubProps {
  isMobile?: boolean;
}

export const RadioHub: React.FC<RadioHubProps> = ({ isMobile = false }) => {
  const [activeArtist, setActiveArtist] = useState(artists[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleArtistChange = (artist: typeof artists[0]) => {
    setActiveArtist(artist);
    setIsPlaying(true);
  };

  const glassStyle: React.CSSProperties = {
    backdropFilter: 'blur(24px)',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '100px',
  };

  const playerStyle: React.CSSProperties = {
    backdropFilter: 'blur(24px)',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '32px',
  };

  const monoStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  };

  // Mobile layout: player-dominant
  if (isMobile) {
    return (
      <div style={{ background: '#050505', color: '#FFF', padding: '20px', width: '100%' }}>
        {/* Compact Artist Selector */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            {artists.map((artist) => (
              <button
                key={artist.id}
                onClick={() => handleArtistChange(artist)}
                style={{
                  ...glassStyle,
                  padding: '8px 16px',
                  color: activeArtist.id === artist.id ? '#FFF' : 'rgba(255, 255, 255, 0.5)',
                  borderColor: activeArtist.id === artist.id ? 'rgba(255, 179, 71, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: activeArtist.id === artist.id ? '0 0 20px rgba(255, 179, 71, 0.05)' : 'none',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <span style={monoStyle}>{artist.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Large Player - Dominant Element */}
        <div
          style={{
            ...playerStyle,
            aspectRatio: '16 / 9',
            overflow: 'hidden',
            position: 'relative',
            width: '100%',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
          }}
        >
          {!isPlaying ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '20px',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg, rgba(255, 179, 71, 0.1), rgba(255, 179, 71, 0.05))`,
                }}
              />
              <div style={{ position: 'relative', zIndex: 20 }}>
                <button
                  onClick={() => setIsPlaying(true)}
                  style={{
                    ...glassStyle,
                    width: '60px',
                    height: '60px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 179, 71, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <Play size={24} fill="#FFF" color="#FFF" style={{ marginLeft: '4px' }} />
                </button>
                <h2 style={{ ...monoStyle, fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {activeArtist.name}
                </h2>
              </div>
            </div>
          ) : (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/videoseries?list=${activeArtist.playlistId}&autoplay=1&modestbranding=1&rel=0&theme=dark&controls=1`}
              title={`${activeArtist.name} Player`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0 }}
            ></iframe>
          )}
        </div>

        {/* Compact Controls */}
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#FFB347',
                animation: 'pulse 2s infinite',
              }}
            />
            <span style={{ ...monoStyle, fontSize: '10px', color: '#FFB347', fontWeight: 'bold' }}>Live Frequency</span>
          </div>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              ...monoStyle,
              fontSize: '9px',
              color: 'rgba(255, 255, 255, 0.4)',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '2px',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFB347';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
            }}
          >
            {isPlaying ? 'Disconnect' : 'Play'}
          </button>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // Desktop layout: player-dominant with compact artist selector
  return (
    <div style={{ background: '#050505', color: '#FFF', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Artist Selector - Top Bar */}
      <div>
        <h3 style={{ ...monoStyle, fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '12px' }}>
          Select Frequency
        </h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          {artists.map((artist) => (
            <button
              key={artist.id}
              onClick={() => handleArtistChange(artist)}
              style={{
                ...glassStyle,
                padding: '10px 24px',
                color: activeArtist.id === artist.id ? '#FFF' : 'rgba(255, 255, 255, 0.5)',
                borderColor: activeArtist.id === artist.id ? 'rgba(255, 179, 71, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                boxShadow: activeArtist.id === artist.id ? '0 0 20px rgba(255, 179, 71, 0.05)' : 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={monoStyle}>{artist.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Large Player - Dominant Element */}
      <div
        style={{
          ...playerStyle,
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
          minHeight: '400px',
        }}
      >
        {!isPlaying ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '40px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, rgba(255, 179, 71, 0.1), rgba(255, 179, 71, 0.05))`,
              }}
            />
            <div style={{ position: 'relative', zIndex: 20 }}>
              <button
                onClick={() => setIsPlaying(true)}
                style={{
                  ...glassStyle,
                  width: '80px',
                  height: '80px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  marginBottom: '24px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 179, 71, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Play size={32} fill="#FFF" color="#FFF" style={{ marginLeft: '4px' }} />
              </button>
              <h2 style={{ ...monoStyle, fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                {activeArtist.name}
              </h2>
            </div>
          </div>
        ) : (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/videoseries?list=${activeArtist.playlistId}&autoplay=1&modestbranding=1&rel=0&theme=dark&controls=1`}
            title={`${activeArtist.name} Player`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0 }}
          ></iframe>
        )}
      </div>

      {/* Bottom Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', paddingLeft: '16px', paddingRight: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#FFB347',
              animation: 'pulse 2s infinite',
            }}
          />
          <span style={{ ...monoStyle, fontSize: '10px', color: '#FFB347', fontWeight: 'bold' }}>Live Frequency</span>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <Volume2 size={14} color="rgba(255, 255, 255, 0.4)" />
          <span style={{ ...monoStyle, fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>Stereo Out</span>
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            ...monoStyle,
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.4)',
            background: 'none',
            border: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '2px',
            cursor: 'pointer',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFB347';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
          }}
        >
          {isPlaying ? 'Disconnect Stream' : 'Initialize Player'}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default RadioHub;
