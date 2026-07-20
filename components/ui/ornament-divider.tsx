export const OrnamentDivider = ({ className = "", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 400 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <line x1="0" y1="20" x2="140" y2="20" stroke={color} strokeWidth="0.5" opacity="0.4" />
    <line x1="260" y1="20" x2="400" y2="20" stroke={color} strokeWidth="0.5" opacity="0.4" />
    <g transform="translate(200,20)">
      <circle r="14" stroke={color} strokeWidth="0.6" fill="none" opacity="0.6" />
      <circle r="8" stroke={color} strokeWidth="0.6" fill="none" opacity="0.5" />
      <g stroke={color} strokeWidth="0.6" opacity="0.7">
        <line x1="-18" y1="0" x2="-26" y2="0" />
        <line x1="18" y1="0" x2="26" y2="0" />
        <line x1="0" y1="-18" x2="0" y2="-26" />
        <line x1="0" y1="18" x2="0" y2="26" />
      </g>
      <circle r="2" fill={color} opacity="0.8" />
    </g>
  </svg>
)
