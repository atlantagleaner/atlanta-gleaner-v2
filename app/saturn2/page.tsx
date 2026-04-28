'use client'

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SiteDropdownMenu } from '@/src/components/navigation/SiteDropdownMenu';
import SaturnScene from '../components/SaturnScene';
import { CrystalBallModule } from '../saturn/components/CrystalBallModule';
import { BlackjackModule } from '../saturn/components/BlackjackModule';

export default function Saturn2Page() {
  const [time, setTime] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isGameModuleOpen, setIsGameModuleOpen] = useState(false);
  const [activeGameModule, setActiveGameModule] = useState<'crystal-ball' | 'blackjack' | null>(null);
  const [isModuleSelectorOpen, setIsModuleSelectorOpen] = useState(false);
  const [navHeight, setNavHeight] = useState(0);

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const moduleSelectorRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (navRef.current) {
        setNavHeight(navRef.current.offsetHeight);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false);
      }
      if (isModuleSelectorOpen && moduleSelectorRef.current && !moduleSelectorRef.current.contains(e.target as Node)) {
        setIsModuleSelectorOpen(false);
      }
    };
    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPlusMenuOpen, isModuleSelectorOpen]);

  const handleSceneReady = (camera: THREE.PerspectiveCamera) => {
    cameraRef.current = camera;
  };

  const navItemStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '100px',
    padding: '10px 24px',
    color: '#FFF',
    fontSize: '11px',
    letterSpacing: '0.15em',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    transition: 'all 0.2s ease',
    userSelect: 'none'
  };

  const dropdownMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    marginTop: '8px',
    background: 'rgba(2, 1, 1, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 0',
    color: '#FFF',
    fontSize: '11px',
    letterSpacing: '0.15em',
    fontFamily: 'monospace',
    zIndex: 1100,
    minWidth: '180px'
  };

  const dropdownItemStyle: React.CSSProperties = {
    padding: '8px 16px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s ease',
  };

  // Style for the game module overlay (responsive to navbar height)
  const gameOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '12px' : '20px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    paddingTop: navHeight + (isMobile ? 12 : 20),
  };

  // Style for the game viewport container (responsive sizing)
  const gameViewportStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    maxWidth: isMobile ? '100%' : '1280px',
    maxHeight: isMobile ? `calc(100vh - ${navHeight + 40}px)` : '720px',
    aspectRatio: isMobile ? '4 / 3' : '8 / 6',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#000',
    border: isMobile ? '2px solid #d4af37' : '4px solid #d4af37',
    boxShadow: isMobile ? '2px 2px 0 rgba(0,0,0,0.8)' : '6px 6px 0 rgba(0,0,0,0.8)',
    boxSizing: 'border-box',
  };

  // Function to handle opening/closing the module selector
  const toggleModuleSelector = () => {
    setIsModuleSelectorOpen(!isModuleSelectorOpen);
  };

  // Function to select a game module
  const selectGameModule = (moduleName: 'crystal-ball' | 'blackjack') => {
    setActiveGameModule(moduleName);
    setIsGameModuleOpen(true);
    setIsModuleSelectorOpen(false);
  };

  // Function to close the game module entirely
  const closeGameModule = () => {
    setActiveGameModule(null);
    setIsGameModuleOpen(false);
    setIsModuleSelectorOpen(false); // Ensure selector is closed when game module closes
  };


  return (
    <div style={{ height: '100vh', width: '100vw', background: '#020101', overflow: 'hidden', position: 'relative' }}> {/* Changed overflow to hidden */}
      {/* Orbital Navbar - Identical to Runway */}
      {isMobile ? (
        // Mobile navbar - two rows
        <nav ref={navRef} style={{
          position: 'fixed', top: '15px', left: '15px', right: '15px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1000,
        }}>
          {/* Row 1: Date/Time + The Atlanta Gleaner + Plus Button (merged) */}
          <div style={{ position: 'relative', width: '100%' }} ref={menuRef}>
            <button
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              style={{ ...navItemStyle, textDecoration: 'none', border: 'none', width: '100%' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 600 }}>{time ? time.toLocaleString('en-US', { month: 'short' }).toUpperCase() + ' ' + time.getDate() : '—'}</span>
                <span style={{ opacity: 0.4, fontSize: '9px' }}>{time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}</span>
              </div>

              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 800, color: '#FFB347', fontSize: '12px' }}>THE ATLANTA GLEANER</span>
                <span style={{ opacity: 0.5, fontSize: '8px', letterSpacing: '0.2em' }}>EDITED BY GEORGE WASHINGTON</span>
              </div>

              <div style={{ marginLeft: 'auto' }}>
                {isPlusMenuOpen ? '−' : '+'}
              </div>
            </button>
              {isPlusMenuOpen && (
                <div>
                  <SiteDropdownMenu open={isPlusMenuOpen} align="right" variant="dark" position="absolute" onSelect={() => setIsPlusMenuOpen(false)} />
                </div>
              )}
          </div>
          {/* Mobile Game Hub Button */}
          <button onClick={toggleModuleSelector} style={{ ...navItemStyle, background: 'rgba(255, 165, 0, 0.1)', borderColor: 'rgba(255, 165, 0, 0.3)', width: '100%' }}>
            DEAL
          </button>
        </nav>
      ) : (
        // Desktop navbar
        <nav ref={navRef} style={{
          position: 'fixed', top: '25px', left: '25px', right: '25px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000,
        }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Date/Time + Title + Plus Button (merged) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              style={{ ...navItemStyle, textDecoration: 'none', border: 'none' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 600 }}>{time ? time.toLocaleString('en-US', { month: 'short' }).toUpperCase() + ' ' + time.getDate() : '—'}</span>
                <span style={{ opacity: 0.4, fontSize: '9px' }}>{time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}</span>
              </div>

              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 800, color: '#FFB347', fontSize: '12px' }}>THE ATLANTA GLEANER</span>
                <span style={{ opacity: 0.5, fontSize: '8px', letterSpacing: '0.2em' }}>EDITED BY GEORGE WASHINGTON</span>
              </div>

              <div style={{ marginLeft: 'auto' }}>
                {isPlusMenuOpen ? '−' : '+'}
              </div>
            </button>
              {isPlusMenuOpen && (
                <div>
                  <SiteDropdownMenu open={isPlusMenuOpen} align="left" variant="dark" position="absolute" onSelect={() => setIsPlusMenuOpen(false)} />
                </div>
              )}
          </div>

          <button onClick={toggleModuleSelector} style={{ ...navItemStyle, background: 'rgba(255, 165, 0, 0.1)', borderColor: 'rgba(255, 165, 0, 0.3)' }}>
            DEAL
          </button>
        </div>
      </nav>
      )}

      {/* 3D Scene Container - Control interactivity */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <SaturnScene onSceneReady={handleSceneReady} isInteractive={!isGameModuleOpen} isMobile={isMobile} />
      </div>

      {/* Aesthetic Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 6, // Below game module overlay (z-index 1001)
          background: 'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.6) 100%)'
        }}
      />

      {/* Game Module Overlay */}
      {isGameModuleOpen && activeGameModule && (
        <div style={gameOverlayStyle}>
          <button
            onClick={closeGameModule}
            style={{
              ...navItemStyle,
              background: 'rgba(255, 165, 0, 0.1)',
              borderColor: 'rgba(255, 165, 0, 0.3)',
              marginBottom: '16px',
              alignSelf: 'flex-end',
              padding: '8px 16px',
              fontSize: '10px',
            }}
          >
            CLOSE
          </button>
          <div style={gameViewportStyle}>
            {activeGameModule === 'crystal-ball' && <CrystalBallModule />}
            {activeGameModule === 'blackjack' && <BlackjackModule />}
          </div>
        </div>
      )}

      {/* Module Selection Menu (appears when DEAL is clicked) */}
      {isModuleSelectorOpen && (
        <div
          ref={moduleSelectorRef}
          style={{
            position: 'fixed',
            top: navHeight + (isMobile ? 15 : 25),
            left: isMobile ? '15px' : '25px',
            right: isMobile ? '15px' : '25px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: 'rgba(2, 1, 1, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '12px',
            fontFamily: 'monospace',
            zIndex: 1050,
            boxSizing: 'border-box',
            maxWidth: isMobile ? 'calc(100vw - 30px)' : 'auto',
          }}
        >
          <div style={{ fontSize: '10px', letterSpacing: '0.15em', opacity: 0.6, marginBottom: '4px' }}>SELECT A VISION</div>
          <button
            onClick={() => selectGameModule('crystal-ball')}
            style={{ ...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none', background: 'transparent', padding: '8px 12px', fontSize: '10px', border: 'none', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            THE CRYSTAL EYE
          </button>
          <button
            onClick={() => selectGameModule('blackjack')}
            style={{ ...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none', background: 'transparent', padding: '8px 12px', fontSize: '10px', border: 'none', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            THE SOUL STAKES
          </button>
        </div>
      )}
    </div>
  );
}
