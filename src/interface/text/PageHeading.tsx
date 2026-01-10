import { H2, YStack } from 'tamagui'

import { H3, H4, H5, SubHeading } from './Headings'

export const PageHeading = ({
  title,
  subTitle,
  subTitle2,
}: {
  title: string
  subTitle?: string
  subTitle2?: string
}) => {
  return (
    <YStack gap="$2">
      <H3 color="$color12" fontWeight="700">
        {title}
      </H3>

      <YStack gap="$0.5">
        {!!subTitle && <SubHeading size="$4">{subTitle}</SubHeading>}
        {!!subTitle2 && (
          <SubHeading size="$4" color="$color12">
            {subTitle2}
          </SubHeading>
        )}
      </YStack>
    </YStack>
  )
}
