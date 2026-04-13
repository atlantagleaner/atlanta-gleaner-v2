'use client'

import React, { useEffect, useState } from 'react'

interface OrbitalNavBarProps {
  showRunway?: boolean
  showOrbit?: boolean
  showTracks?: boolean
  showPlus?: boolean
  onResetOrbit?: () => void
  layout?: 'orbital' | 'archive' // 'orbital' = space-between, 'archive' = left-aligned stacked
}

export function OrbitalNavBar({
  showRunway = false,
  showOrbit = false,
  showTracks = false,
  showPlus = true,
  onResetOrbit,
  layout = 'archive',
}: OrbitalNavBarProps) {
  const [time, setTime] = useState(new Date())
  const [isMobile, setIsMobile] = useState(false)
  const [isPlusOpen, setIsPlusOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    userSelect: 'none',
  }

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
    minWidth: '180px',
  }

  const dropdownItemStyle: React.CSSProperties = {
    padding: '8px 16px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s ease',
  }

  return (
    <>
      {isMobile ? (
        // Mobile navbar - two rows
        <nav
          style={{
            position: 'fixed',
            top: '15px',
            left: '15px',
            right: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            zIndex: 1000,
            ...(layout === 'archive' && {
              background: 'rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              padding: '12px 15px',
            }),
          }}
        >
          {/* Row 1: Date/Time + The Atlanta Gleaner */}
          <a href="/archive" style={{ ...navItemStyle, textDecoration: 'none' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                lineHeight: '1.2',
              }}
            >
              <span style={{ fontWeight: 600 }}>
                {time
                  .toLocaleString('en-US', { month: 'short' })
                  .toUpperCase()}{' '}
                {time.getDate()}
              </span>
              <span style={{ opacity: 0.4, fontSize: '9px' }}>
                {time.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>

            <div
              style={{
                width: '1px',
                height: '24px',
                background: 'rgba(255,255,255,0.2)',
              }}
            />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                lineHeight: '1.2',
              }}
            >
              <span style={{ fontWeight: 800, color: '#FFB347', fontSize: '12px' }}>
                THE ATLANTA GLEANER
              </span>
              <span
                style={{
                  opacity: 0.5,
                  fontSize: '8px',
                  letterSpacing: '0.2em',
                }}
              >
                EDITED BY GEORGE WASHINGTON
              </span>
            </div>
          </a>

          {/* Row 2: Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {showRunway && (
              <button
                onClick={() => window.location.reload()}
                style={{
                  ...navItemStyle,
                  background: 'rgba(255, 165, 0, 0.1)',
                  borderColor: 'rgba(255, 165, 0, 0.3)',
                }}
              >
                RUNWAY
              </button>
            )}

            {showOrbit && (
              <button onClick={onResetOrbit} style={{ ...navItemStyle }}>
                ORBIT
              </button>
            )}

            {showTracks && (
              <div style={{ position: 'relative' }}>
                <button style={{ ...navItemStyle, padding: '10px 18px', minWidth: '45px', justifyContent: 'center' }}>
                  TRACKS ▾
                </button>
              </div>
            )}

            {showPlus && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsPlusOpen(!isPlusOpen)}
                  style={{ ...navItemStyle, padding: '10px 15px' }}
                >
                  {isPlusOpen ? '−' : '+'}
                </button>
                {isPlusOpen && (
                  <div style={{ ...dropdownMenuStyle }}>
                    <a
                      href="/archive"
                      style={{
                        ...dropdownItemStyle,
                        display: 'block',
                        color: '#FFF',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          'rgba(255, 165, 0, 0.1)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      ARCHIVE
                    </a>
                    <a
                      href="/runway"
                      style={{
                        ...dropdownItemStyle,
                        display: 'block',
                        color: '#FFF',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          'rgba(255, 165, 0, 0.1)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      RUNWAY
                    </a>
                    <a
                      href="/saturn"
                      style={{
                        ...dropdownItemStyle,
                        display: 'block',
                        color: '#FFF',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          'rgba(255, 165, 0, 0.1)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      SATURN
                    </a>
                    <a
                      href="/vault"
                      style={{
                        ...dropdownItemStyle,
                        display: 'block',
                        color: '#FFF',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          'rgba(255, 165, 0, 0.1)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      VAULT
                    </a>
                    <a
                      href="/about"
                      style={{
                        ...dropdownItemStyle,
                        display: 'block',
                        color: '#FFF',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          'rgba(255, 165, 0, 0.1)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      ABOUT
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      ) : (
        // Desktop navbar
        <nav
          style={{
            position: 'fixed',
            top: '25px',
            left: '25px',
            right: layout === 'orbital' ? '25px' : undefined,
            display: 'flex',
            justifyContent:
              layout === 'orbital'
                ? 'space-between'
                : 'flex-start',
            alignItems: 'center',
            flexDirection: layout === 'orbital' ? 'row' : 'row',
            gap: '15px',
            zIndex: 1000,
            ...(layout === 'archive' && {
              background: 'rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              padding: '12px 15px',
            }),
          }}
        >
          {/* Date/Time Link + Title */}
          <a href="/archive" style={{ ...navItemStyle, textDecoration: 'none' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                lineHeight: '1.2',
              }}
            >
              <span style={{ fontWeight: 600 }}>
                {time
                  .toLocaleString('en-US', { month: 'short' })
                  .toUpperCase()}{' '}
                {time.getDate()}
              </span>
              <span style={{ opacity: 0.4, fontSize: '9px' }}>
                {time.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>

            <div
              style={{
                width: '1px',
                height: '24px',
                background: 'rgba(255,255,255,0.2)',
              }}
            />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                lineHeight: '1.2',
              }}
            >
              <span style={{ fontWeight: 800, color: '#FFB347', fontSize: '12px' }}>
                THE ATLANTA GLEANER
              </span>
              <span
                style={{
                  opacity: 0.5,
                  fontSize: '8px',
                  letterSpacing: '0.2em',
                }}
              >
                EDITED BY GEORGE WASHINGTON
              </span>
            </div>
          </a>

          {layout === 'orbital' && (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              {showRunway && (
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    ...navItemStyle,
                    background: 'rgba(255, 165, 0, 0.1)',
                    borderColor: 'rgba(255, 165, 0, 0.3)',
                  }}
                >
                  RUNWAY
                </button>
              )}

              {showOrbit && (
                <button onClick={onResetOrbit} style={{ ...navItemStyle }}>
                  ORBIT
                </button>
              )}

              {showTracks && (
                <div style={{ position: 'relative' }}>
                  <button
                    style={{
                      ...navItemStyle,
                      padding: '10px 18px',
                      minWidth: '45px',
                      justifyContent: 'center',
                    }}
                  >
                    TRACKS ▾
                  </button>
                </div>
              )}

              {showPlus && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setIsPlusOpen(!isPlusOpen)}
                    style={{ ...navItemStyle, padding: '10px 15px' }}
                  >
                    {isPlusOpen ? '−' : '+'}
                  </button>
                  {isPlusOpen && (
                    <div style={{ ...dropdownMenuStyle, right: '0' }}>
                      <a
                        href="/archive"
                        style={{
                          ...dropdownItemStyle,
                          display: 'block',
                          color: '#FFF',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            'rgba(255, 165, 0, 0.1)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'transparent')
                        }
                      >
                        ARCHIVE
                      </a>
                      <a
                        href="/runway"
                        style={{
                          ...dropdownItemStyle,
                          display: 'block',
                          color: '#FFF',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            'rgba(255, 165, 0, 0.1)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'transparent')
                        }
                      >
                        RUNWAY
                      </a>
                      <a
                        href="/saturn"
                        style={{
                          ...dropdownItemStyle,
                          display: 'block',
                          color: '#FFF',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            'rgba(255, 165, 0, 0.1)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'transparent')
                        }
                      >
                        SATURN
                      </a>
                      <a
                        href="/vault"
                        style={{
                          ...dropdownItemStyle,
                          display: 'block',
                          color: '#FFF',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            'rgba(255, 165, 0, 0.1)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'transparent')
                        }
                      >
                        VAULT
                      </a>
                      <a
                        href="/about"
                        style={{
                          ...dropdownItemStyle,
                          display: 'block',
                          color: '#FFF',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            'rgba(255, 165, 0, 0.1)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'transparent')
                        }
                      >
                        ABOUT
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {layout === 'archive' && showPlus && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsPlusOpen(!isPlusOpen)}
                style={{ ...navItemStyle, padding: '10px 15px' }}
              >
                {isPlusOpen ? '−' : '+'}
              </button>
              {isPlusOpen && (
                <div style={{ ...dropdownMenuStyle }}>
                  <a
                    href="/archive"
                    style={{
                      ...dropdownItemStyle,
                      display: 'block',
                      color: '#FFF',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(255, 165, 0, 0.1)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    ARCHIVE
                  </a>
                  <a
                    href="/runway"
                    style={{
                      ...dropdownItemStyle,
                      display: 'block',
                      color: '#FFF',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(255, 165, 0, 0.1)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    RUNWAY
                  </a>
                  <a
                    href="/saturn"
                    style={{
                      ...dropdownItemStyle,
                      display: 'block',
                      color: '#FFF',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(255, 165, 0, 0.1)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    SATURN
                  </a>
                  <a
                    href="/vault"
                    style={{
                      ...dropdownItemStyle,
                      display: 'block',
                      color: '#FFF',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(255, 165, 0, 0.1)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                      VAULT
                  </a>
                  <a
                    href="/about"
                    style={{
                      ...dropdownItemStyle,
                      display: 'block',
                      color: '#FFF',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(255, 165, 0, 0.1)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    ABOUT
                  </a>
                </div>
              )}
            </div>
          )}
        </nav>
      )}
    </>
  )
}
