import { Paragraph, styled, XStack, YStack } from 'tamagui'

const TableFrame = styled(YStack, {
  my: '$4',
  borderWidth: 1,
  borderColor: '$borderColor',
  rounded: '$4',
  overflow: 'hidden',
})

const TableRow = styled(XStack, {
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  variants: {
    last: {
      true: {
        borderBottomWidth: 0,
      },
    },
  } as const,
})

const TableCell = styled(Paragraph, {
  p: '$3',
  size: '$4',
  variants: {
    head: {
      true: {
        fontWeight: '600',
        bg: '$color2',
      },
    },
  } as const,
})

export function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const colCount = headers.length
  const colWidth = `${100 / colCount}%`

  return (
    <TableFrame>
      <TableRow>
        {headers.map((header, i) => (
          <TableCell key={i} head flexBasis={colWidth} flexShrink={0}>
            {header}
          </TableCell>
        ))}
      </TableRow>
      {rows.map((row, i) => (
        <TableRow key={i} last={i === rows.length - 1}>
          {row.map((cell, j) => (
            <TableCell key={j} flexBasis={colWidth} flexShrink={0}>
              {cell}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableFrame>
  )
}
