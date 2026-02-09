export type CheckoutMode = 'hosted' | 'embedded'

export interface ProductPrice {
  id: string
  amount: number | null
  currency: string
  interval: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  images: string[]
  prices: ProductPrice[]
}
