export default function Logo({ size=28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="hay" x1="0" x2="1">
            <stop offset="0%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <rect x="8" y="20" width="48" height="28" rx="6" fill="url(#hay)" stroke="#a16207" strokeWidth="2"/>
        <line x1="14" y1="28" x2="50" y2="28" stroke="#a16207" strokeWidth="2" />
        <line x1="14" y1="40" x2="50" y2="40" stroke="#a16207" strokeWidth="2" />
      </svg>
      <span className="font-semibold">Seno/Sláma</span>
    </div>
  )
}
