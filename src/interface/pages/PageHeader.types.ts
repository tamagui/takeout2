import type { IconComponent } from '../icons/types'
import type { ReactNode } from 'react'

export type PageHeaderProps = {
  Icon?: IconComponent
  title: string
  after?: ReactNode
}
