export type NotificationItem = {
  id: string
  avatar: string
  name: string
  message: string
  time: string
}

export type NotificationCardProps = {
  notification: NotificationItem
  index: number
  isSpread: boolean
  totalCount: number
}
