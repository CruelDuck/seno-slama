export const runtime = 'edge'
import { ImageResponse } from 'next/og'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title')?.slice(0, 70) || 'Seno/Sláma'
  const badge = searchParams.get('badge') || ''
  const sub = searchParams.get('sub')?.slice(0, 80) || 'Katalog sena a slámy'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0b1324',
          color: 'white',
          padding: '64px',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: 'linear-gradient(90deg,#fde68a,#f59e0b)',
              border: '2px solid #a16207',
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 700 }}>Seno/Sláma</div>
        </div>

        {badge && (
          <div
            style={{
              display: 'inline-flex',
              fontSize: 20,
              padding: '6px 12px',
              borderRadius: 999,
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #10b981',
              marginBottom: 18,
              width: 'fit-content',
            }}
          >
            {badge}
          </div>
        )}

        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 26, color: '#d1d5db', marginTop: 18 }}>{sub}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
