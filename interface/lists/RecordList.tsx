import { Path, Svg } from 'react-native-svg'
import { Paragraph, SizableText, useTheme, View, XStack, YStack, styled } from 'tamagui'
import { Icons } from '~/interface/icons'
import type { RecordListProps, RecordRowProps } from './recordListContract'

// android and web: the grouped card contrast-ui's Form Section draws on these
// legs, and its 56pt NavigationRow, so a record list and a settings list read
// as one family. RecordList.ios.tsx is the iOS leg.

const RowFrame = styled(XStack, {
  minH: 56,
  px: 18,
  py: 9,
  gap: 13,
  items: 'center',
  variants: {
    pressable: {
      true: { cursor: 'pointer', bg: 'transparent press:color-3' },
    },
  } as const,
})

export function RecordList({ title, children, testID }: RecordListProps) {
  return (
    <YStack gap={7} testID={testID}>
      {title ? (
        <Paragraph fontWeight="700" color="color-10">
          {title}
        </Paragraph>
      ) : null}
      <YStack rounded="6" bg="color-2" py={5} overflow="hidden">
        {children}
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
  return (
    <RowFrame pressable={!!onPress} onPress={onPress} testID={testID}>
      {leading ? (
        <View width={32} items="center">
          {leading}
        </View>
      ) : null}
      <YStack gap={2} flex={1} minW={0}>
        <Paragraph numberOfLines={1}>{title}</Paragraph>
        {subtitle ? (
          <Paragraph color="color-10" numberOfLines={1}>
            {subtitle}
          </Paragraph>
        ) : null}
      </YStack>
      {/* the title keeps the row: a long value truncates first */}
      {typeof value === 'string' ? (
        <SizableText size="4" color="color-10" numberOfLines={1} shrink={1} maxW="40%">
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
          width={40}
          height={40}
          items="center"
          justify="center"
          cursor="pointer"
          onPress={() => onCheckedChange(!checked)}
          testID={testID ? `${testID}-check` : undefined}
        >
          {/* material's checkbox: an 18pt box, a 2pt outline, filled when checked */}
          <View
            width={18}
            height={18}
            rounded={2}
            items="center"
            justify="center"
            borderWidth={checked ? 0 : 2}
            borderColor="color-11"
            bg={checked ? 'accent-background' : 'transparent'}
          >
            {checked ? <CheckMark /> : null}
          </View>
        </View>
      ) : onPress ? (
        <Icons.Disclosure size={14} color="color-8" />
      ) : null}
    </RowFrame>
  )
}

// the checkbox's own mark, part of the control rather than an app icon
function CheckMark() {
  const color = useTheme()['accent-color']?.get()
  return (
    <Svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M20 6 9 17l-5-5" />
    </Svg>
  )
}
