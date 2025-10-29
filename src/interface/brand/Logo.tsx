import { Image } from '~/interface/image/Image'
import logoSvg from './logo.svg'

export const Logo = ({ onPress }: { onPress?: () => void }) => {
  return (
    <Image
      width={200 * 0.8}
      height={40 * 0.8}
      objectFit="contain"
      src={logoSvg}
      onPress={onPress}
    />
  )
}
