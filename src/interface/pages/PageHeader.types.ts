import type { ReactNode } from 'react'
import type { IconComponent } from '../icons/types'

export type PageHeaderProps = {
  Icon?: IconComponent
  title: string
  after?: ReactNode
}
