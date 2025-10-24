import { Image } from '@tamagui/image-next'
import type { LogoProps } from './type'

export const Logo = ({ size = 42, ...props }: LogoProps) => {
  return (
    <Image
      width={size}
      height={size}
      tintColor="white"
      objectFit="contain"
      src={require('../../../assets/logo.png')}
      transition="200ms"
      {...props}
    />
  )
}
