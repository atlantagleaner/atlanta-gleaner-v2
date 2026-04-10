export default function OrbitalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-orbital="true"
      style={{
        minHeight: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        backgroundColor: '#020101',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Custom orbital navigation - replaces standard NavBar */}
      <nav
        style={{
          height: '60px',
          background: 'rgba(2, 1, 1, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(238, 237, 235, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px',
          flexShrink: 0,
        }}
      >
        {/* Left: Time/Landing button will be added by page */}
        <div style={{ width: '60px' }} />

        {/* Center: Track controls will be added by page */}
        <div style={{ flex: 1 }} />

        {/* Right: Menu button will be added by page */}
        <div style={{ width: '60px' }} />
      </nav>

      {children}
    </div>
  )
}
