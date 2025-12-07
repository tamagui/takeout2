import Svg, { Path } from 'react-native-svg'
import { useTheme } from 'tamagui'

import { getIconSize } from '~/interface/icons/helpers'

import { useIconProps } from './useIconProps'

import type { IconProps } from '~/interface/icons/types'

export const AppleIcon = (props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 23 22" fill="none" {...svgProps}>
      <Path
        d="M15.5015 5.88037C13.769 5.88037 13.0368 6.70709 11.8303 6.70709C10.5932 6.70709 9.6496 5.88639 8.14827 5.88639C6.67874 5.88639 5.11167 6.78357 4.11652 8.31197C2.71917 10.4673 2.95636 14.5265 5.21952 17.9847C6.02905 19.2226 7.11015 20.6109 8.52812 20.626H8.5539C9.78624 20.626 10.1523 19.819 11.8483 19.8096H11.8741C13.5447 19.8096 13.8799 20.6212 15.1071 20.6212H15.1328C16.5508 20.6062 17.6899 19.0679 18.4994 17.8347C19.0821 16.9478 19.2987 16.5027 19.7455 15.4994C16.4718 14.2567 15.9458 9.61564 19.1835 7.83631C18.1952 6.59881 16.8065 5.88209 15.4972 5.88209L15.5015 5.88037Z"
        fill={fill}
      />
      <Path
        d="M15.1204 1.375C14.0891 1.44504 12.886 2.1016 12.1813 2.95883C11.5419 3.7357 11.016 4.88812 11.2222 6.00574H11.3047C12.403 6.00574 13.5271 5.34445 14.1836 4.49711C14.8161 3.69059 15.2957 2.54762 15.1204 1.375Z"
        fill={fill}
      />
    </Svg>
  )
}
