import { sfSymbol } from 'contrast-ui/icons/sfSymbol'
import { Children, createContext, isValidElement, use } from 'react'
import { SizableText, View, XStack, YStack, styled } from 'tamagui'
import { Icons } from '~/interface/icons'
import type { RecordListProps, RecordRowProps } from './recordListContract'

// iOS: the inset-grouped list, at the iOS 27 metrics contrast-kit measured for
// SwiftUI's own (iPhone 17 Pro): a 26pt card corner, a 52pt row floor, a 16pt
// row inset, a 1pt separator inset 16 from both card edges that starts at the
// title (40 past the inset) when the row leads with a glyph, and a 17pt
// semibold header in a 40.33pt box. drawn here rather than by SwiftUI's List
// because a native List owns its scrolling and cannot sit under a chart in the
// page's scroll view.

const RowFrame = styled(XStack, {
  minH: 52,
  px: 16,
  py: 11,
  gap: 16,
  items: 'center',
  variants: {
    pressable: {
      true: { cursor: 'pointer', bg: 'transparent press:color-4' },
    },
  } as const,
})

const CheckOff = sfSymbol('circle')
const CheckOn = sfSymbol('checkmark.circle.fill')

const LastRow = createContext(true)

export function RecordList({ title, children, testID }: RecordListProps) {
  const rows = Children.toArray(children)
  return (
    <YStack testID={testID}>
      {title ? (
        <SizableText
          size="iosBody"
          fontWeight="600"
          color="color-10"
          px={16}
          pt={10}
          minH={121 / 3}
        >
          {title}
        </SizableText>
      ) : null}
      <YStack rounded={26} bg="color-2" overflow="hidden">
        {rows.map((row, index) => (
          <LastRow key={isValidElement(row) ? row.key : index} value={index === rows.length - 1}>
            {row}
          </LastRow>
        ))}
      </YStack>
    </YStack>
  )
}

export function RecordRow({
  title,
  subtitle,
  leading,
  value,
  checked,
  onCheckedChange,
  onPress,
  testID,
}: RecordRowProps) {
  const last = use(LastRow)
  return (
    <RowFrame pressable={!!onPress} onPress={onPress} testID={testID}>
      {leading ? (
        <View width={24} items="center">
          {leading}
        </View>
      ) : null}
      <YStack gap={1} flex={1} minW={0}>
        <SizableText size="iosBody" color="color" numberOfLines={1}>
          {title}
        </SizableText>
        {subtitle ? (
          <SizableText size="iosSubheadline" color="color-10" numberOfLines={1}>
            {subtitle}
          </SizableText>
        ) : null}
      </YStack>
      {/* the title keeps the row: a long value truncates first */}
      {typeof value === 'string' ? (
        <SizableText size="iosBody" color="color-10" numberOfLines={1} shrink={1} maxW="40%">
          {value}
        </SizableText>
      ) : (
        value
      )}
      {onCheckedChange ? (
        <View
          role="checkbox"
          aria-checked={!!checked}
          aria-label={title}
          width={44}
          height={44}
          mr={-10}
          items="center"
          justify="center"
          onPress={() => onCheckedChange(!checked)}
          testID={testID ? `${testID}-check` : undefined}
        >
          {checked ? (
            <CheckOn size={24} color="accent-background" />
          ) : (
            <CheckOff size={24} color="color-8" />
          )}
        </View>
      ) : onPress ? (
        <Icons.Disclosure size={13} color="color-8" />
      ) : null}
      {last ? null : (
        <View position="absolute" b={0} l={leading ? 56 : 16} r={16} h={1} bg="border-color" />
      )}
    </RowFrame>
  )
}
