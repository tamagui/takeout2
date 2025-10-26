import { memo } from 'react'
import Svg, { Path } from 'react-native-svg'
import { useTheme, View } from 'tamagui'

type TabItemProps = {
  label: string
  isActive: boolean
}

const TabItemComponent = ({ label, isActive }: TabItemProps) => {
  const theme = useTheme()
  const fillColor = isActive ? theme.color.val : theme.color8.val

  const icon =
    label === 'Grid' ? (
      <Svg width={24} height={24} viewBox="0 0 256 256" fill="none">
        <Path
          d="M200,36H56A20,20,0,0,0,36,56V200a20,20,0,0,0,20,20H200a20,20,0,0,0,20-20V56A20,20,0,0,0,200,36Zm-4,80H140V60h56ZM116,60v56H60V60ZM60,140h56v56H60Zm80,56V140h56v56Z"
          fill={fillColor}
        />
      </Svg>
    ) : label === 'ArrowDownUp' ? (
      <Svg width={24} height={24} viewBox="0 0 256 256" fill="none">
        <Path
          d="M120.49,167.51a12,12,0,0,1,0,17l-32,32a12,12,0,0,1-17,0l-32-32a12,12,0,1,1,17-17L68,179V48a12,12,0,0,1,24,0V179l11.51-11.52A12,12,0,0,1,120.49,167.51Zm96-96-32-32a12,12,0,0,0-17,0l-32,32a12,12,0,0,0,17,17L164,77V208a12,12,0,0,0,24,0V77l11.51,11.52a12,12,0,0,0,17-17Z"
          fill={fillColor}
        />
      </Svg>
    ) : label === 'Characters' ? (
      <Svg width={24} height={24} viewBox="0 0 256 256" fill="none">
        <Path
          d="M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z"
          fill={fillColor}
        />
      </Svg>
    ) : (
      <Svg width={24} height={24} viewBox="0 0 256 256" fill="none">
        <Path
          d="M224,196h-4V40a12,12,0,0,0-12-12H152a12,12,0,0,0-12,12V76H96A12,12,0,0,0,84,88v36H48a12,12,0,0,0-12,12v60H32a12,12,0,0,0,0,24H224a12,12,0,0,0,0-24ZM164,52h32V196H164Zm-56,48h32v96H108ZM60,148H84v48H60Z"
          fill={fillColor}
        />
      </Svg>
    )

  return <View>{icon}</View>
}

export const TabItem = memo(TabItemComponent)
