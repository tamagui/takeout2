import type { ReactNode } from 'react'
import type { ViewProps } from 'tamagui'

export interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  title?: string
  children: ReactNode
  snapPoints?: string[] | number[]
  contentStyle?: ViewProps
}

export interface SheetRef {
  expand: () => void
  collapse: () => void
}
