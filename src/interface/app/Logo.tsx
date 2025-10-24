import { Image } from '~/interface/image/Image'
import type { LogoProps } from './type'

export const Logo = ({ size = 28 }: LogoProps) => {
  return (
    <Image
      $theme-light={{
        opacity: 0.5,
      }}
      width={size}
      height={size}
      src="/brandmark.svg"
    />
  )
}
