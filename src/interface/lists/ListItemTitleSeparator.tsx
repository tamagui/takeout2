import { XStack, H6, Separator } from 'tamagui'

export const ListItemTitleSeparator = ({ children }: { children: string }) => {
  return (
    <XStack items="center" gap="$4" my="$4">
      <H6 size="$3" fontFamily="$mono">
        {children}
      </H6>

      <Separator opacity={0.25} />
    </XStack>
  )
}
