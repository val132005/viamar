type ViamarLogoProps = {
  className?: string
}

export function ViamarLogo({ className = 'h-12 w-[240px]' }: ViamarLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 48"
      fill="none"
      role="img"
      aria-label="Grupo Viamar"
      className={className}
    >
      <defs>
        <radialGradient id="viamarSphere" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#5FC2F5" />
          <stop offset="45%" stopColor="#039BE5" />
          <stop offset="100%" stopColor="#12436B" />
        </radialGradient>
        <linearGradient id="viamarRule" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#206AA9" />
          <stop offset="100%" stopColor="#206AA9" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <text
        x="6"
        y="19"
        fontFamily="'Open Sans', system-ui, sans-serif"
        fontSize="11"
        fontWeight="700"
        fontStyle="italic"
        letterSpacing="3.4"
        fill="#12436B"
      >
        GRUPO
      </text>
      <rect x="7" y="23" width="168" height="1.4" fill="url(#viamarRule)" />
      <text
        x="6"
        y="43"
        fontFamily="'Open Sans', system-ui, sans-serif"
        fontSize="23"
        fontWeight="800"
        fontStyle="italic"
        letterSpacing="1.2"
        fill="#206AA9"
      >
        VIAMAR
      </text>
      <g transform="translate(196, 8)">
        <circle cx="16" cy="16" r="16" fill="url(#viamarSphere)" />
        <ellipse cx="11" cy="10" rx="7.5" ry="5" fill="#FFFFFF" opacity="0.28" />
      </g>
    </svg>
  )
}
