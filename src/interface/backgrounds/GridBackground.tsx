import { memo } from 'react'
import { View, useThemeName } from 'tamagui'

export interface GridBackgroundProps {
  opacity?: number
}

export const GridBackground = memo(({ opacity = 1 }: GridBackgroundProps) => {
  const theme = useThemeName()
  const isDark = theme?.includes('dark')

  return (
    <View
      position="absolute"
      t={0}
      l={0}
      r={0}
      b={0}
      overflow="hidden"
      pointerEvents="none"
      opacity={opacity}
      bg={isDark ? undefined : 'rgba(245, 243, 255, 0.3)'}
    >
      {/* CSS Grid Pattern */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes grid-fade-in {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .modern-grid-bg {
              position: absolute;
              inset: 0;
              background-image:
                linear-gradient(${isDark ? 'rgba(150, 150, 170, 0.03)' : 'rgba(147, 139, 255, 0.035)'} 1px, transparent 1px),
                linear-gradient(90deg, ${isDark ? 'rgba(150, 150, 170, 0.03)' : 'rgba(147, 139, 255, 0.035)'} 1px, transparent 1px);
              background-size: 50px 50px;
              background-position: -1px -1px;
              mask-image: radial-gradient(ellipse at center, transparent 0%, black 85%);
              -webkit-mask-image: radial-gradient(ellipse at center, transparent 0%, black 85%);
              animation: grid-fade-in 1s ease-out;
              ${isDark ? 'filter: blur(0.6px);' : ''}
            }

            .modern-grid-highlight {
              position: absolute;
              inset: 0;
              background: radial-gradient(
                circle at 30% 20%,
                ${isDark ? 'rgba(99, 102, 241, 0.06)' : 'rgba(147, 139, 255, 0.06)'} 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 70% 60%,
                ${isDark ? 'rgba(236, 72, 153, 0.06)' : 'rgba(255, 139, 200, 0.05)'} 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 20% 80%,
                ${isDark ? 'rgba(139, 92, 246, 0.06)' : 'rgba(180, 139, 255, 0.06)'} 0%,
                transparent 50%
              );
              animation: grid-fade-in 1.5s ease-out;
              ${isDark ? 'filter: blur(0.8px);' : ''}
            }
          `,
        }}
      />

      <div className="modern-grid-bg" />
      <div className="modern-grid-highlight" />

      {/* Gradient overlay similar to PageContainer */}
    </View>
  )
})

GridBackground.displayName = 'GridBackground'
