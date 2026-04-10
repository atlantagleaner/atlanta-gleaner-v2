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
      {children}
    </div>
  )
}
