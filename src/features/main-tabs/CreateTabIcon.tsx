import { router } from 'one'
import type { StyleProp, ViewStyle } from 'react-native'
import { PlusCircleIcon } from '~/interface/icons/phosphor/PlusCircleIcon'
import type { SheetRef } from '~/interface/sheet/Sheet'
import { HapticTab } from '~/interface/tabs/HapticTab'
import { useTabIconSize } from './useTabIconSize'

let sheetRef: SheetRef | null = null

export const setCreateSheetRef = (ref: SheetRef | null) => {
  sheetRef = ref
}

export const CreateTabIcon = ({
  customIcon,
  style,
}: {
  customIcon?: React.ReactNode
  style?: StyleProp<ViewStyle>
}) => {
  const { smallerIconSize } = useTabIconSize()

  return (
    <HapticTab
      style={[
        {
          flex: 1,
          marginTop: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      onPress={() => {
        // sheetRef?.expand()
        // router.push('/studio/create-content')
      }}
    >
      {customIcon ? customIcon : <PlusCircleIcon size={smallerIconSize} />}
    </HapticTab>
  )
}
