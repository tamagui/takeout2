import { memo } from 'react'
import { SizableText, XStack } from 'tamagui'

import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'

interface HomePaginationProps {
  currentPage: number
  hasMore: boolean
  onPrevPage: () => void
  onNextPage: () => void
}

export const HomePagination = memo(
  ({ currentPage, hasMore, onPrevPage, onNextPage }: HomePaginationProps) => {
    const hasPrev = currentPage > 1

    if (!hasPrev && !hasMore) {
      return null
    }

    return (
      <XStack justify="center" items="center" gap="$4" py="$4">
        <ButtonSimple
          size="small"
          glass
          disabled={!hasPrev}
          onPress={onPrevPage}
          icon={<CaretLeftIcon size={16} />}
        >
          Previous
        </ButtonSimple>

        <SizableText size="$3" color="$color10">
          Page {currentPage}
        </SizableText>

        <ButtonSimple
          size="small"
          glass
          disabled={!hasMore}
          onPress={onNextPage}
          icon={<CaretRightIcon size={16} />}
          iconAfter
        >
          Next
        </ButtonSimple>
      </XStack>
    )
  }
)
