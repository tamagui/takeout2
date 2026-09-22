import { memo } from 'react'
import { html, SizableText } from 'tamagui'

import { Button } from '../buttons/Button'
import { CaretLeftIcon } from '../icons/phosphor/CaretLeftIcon'
import { CaretRightIcon } from '../icons/phosphor/CaretRightIcon'

export interface PaginationProps {
  currentPage: number
  hasMore: boolean
  onPrevPage: () => void
  onNextPage: () => void
}

export const Pagination = memo(
  ({ currentPage, hasMore, onPrevPage, onNextPage }: PaginationProps) => {
    const hasPrev = currentPage > 1

    if (!hasPrev && !hasMore) {
      return null
    }

    return (
      <html.nav
        aria-label="Pagination"
        display="flex"
        flexDirection="row"
        justify="center"
        items="center"
        gap="4"
        py="4"
      >
        <Button
          size="small"
          glass
          disabled={!hasPrev}
          onPress={onPrevPage}
          icon={<CaretLeftIcon size={16} />}
        >
          Previous
        </Button>

        <SizableText size="3" color="color10">
          Page {currentPage}
        </SizableText>

        <Button
          size="small"
          glass
          disabled={!hasMore}
          onPress={onNextPage}
          icon={<CaretRightIcon size={16} />}
          iconAfter
        >
          Next
        </Button>
      </html.nav>
    )
  },
)
