import { YStack } from 'tamagui'
import { H5 } from './Headings'
import { SubTitle } from './SubTitle'

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
      <H5 size="$7" color="$color12" fontWeight="600">
        {title}
      </H5>

      <YStack gap="$0.5">
        {!!subTitle && <SubTitle size="$4">{subTitle}</SubTitle>}
        {!!subTitle2 && (
          <SubTitle size="$4" color="$color12">
            {subTitle2}
          </SubTitle>
        )}
      </YStack>
    </YStack>
  )
}
