import { memo } from 'react'
import { Maximize2, Minimize2 } from '@tamagui/lucide-icons'
import { Button, type ButtonProps } from 'tamagui'

export const ButtonMaximize = memo(
  ({ minimize, ...props }: ButtonProps & { minimize?: boolean }) => {
    return (
      <ButtonControl scaleIcon={1} icon={minimize ? Minimize2 : Maximize2} {...props} />
    )
  }
)

export const ButtonControl = memo((props: ButtonProps) => {
  return <Button size="$3" elevation={2} circular scaleIcon={1.2} {...props} />
})
