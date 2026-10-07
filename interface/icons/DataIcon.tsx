import { Activity } from './lucide/Activity'
import { Car } from './lucide/Car'
import { Film } from './lucide/Film'
import { Fuel } from './lucide/Fuel'
import { Gift } from './lucide/Gift'
import { House } from './lucide/House'
import { MapPin } from './lucide/MapPin'
import { Receipt } from './lucide/Receipt'
import { ShoppingBag } from './lucide/ShoppingBag'
import { ShoppingCart } from './lucide/ShoppingCart'
import { Utensils } from './lucide/Utensils'
import { Wallet } from './lucide/Wallet'
import { Zap } from './lucide/Zap'
import type { ComponentProps } from 'react'

const dataIcons = {
  activity: Activity,
  bag: ShoppingBag,
  car: Car,
  film: Film,
  fuel: Fuel,
  gift: Gift,
  home: House,
  'map-pin': MapPin,
  receipt: Receipt,
  'shopping-cart': ShoppingCart,
  utensils: Utensils,
  wallet: Wallet,
  zap: Zap,
} satisfies Record<string, typeof Activity>

export type DataIconName = keyof typeof dataIcons

export function DataIcon({
  name,
  ...iconProps
}: { name: DataIconName } & ComponentProps<typeof Activity>) {
  const Icon = dataIcons[name]
  return <Icon {...iconProps} />
}
