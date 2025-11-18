export const GradientGlitchText = ({ children }: { children: string }) => {
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      data-text={children}
      className="glitch-active "
    >
      {children}
    </span>
  )
}
