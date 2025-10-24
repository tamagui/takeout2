import type { ReactNode } from 'react'

type TextWithIconProps = {
  icon: ReactNode
  children: ReactNode
}

export function TextWithIcon({ icon, children }: TextWithIconProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {/* centered on the line without disrupting line height */}
      <span style={{ marginTop: -5, transform: `translateY(2.5px)` }}>{icon}</span>
      <span>{children}</span>
    </span>
  )
}
