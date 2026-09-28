/** Rounded gear drawn in the same stroke style as the shapes. */
export function GearIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  const teeth = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4)
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden fill="none" stroke={color}>
      <circle cx="12" cy="12" r="6.25" strokeWidth={2.25} />
      <circle cx="12" cy="12" r="2.25" strokeWidth={2} />
      {teeth.map((a) => (
        <line
          key={a}
          x1={12 + Math.cos(a) * 7.5}
          y1={12 + Math.sin(a) * 7.5}
          x2={12 + Math.cos(a) * 9.75}
          y2={12 + Math.sin(a) * 9.75}
          strokeWidth={2.75}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
