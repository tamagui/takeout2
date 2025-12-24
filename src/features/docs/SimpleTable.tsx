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

const TableCellContainer = styled(YStack, {
  p: '$3',
  variants: {
    head: {
      true: {
        bg: '$color2',
      },
    },
  } as const,
})

const TableCellText = styled(Paragraph, {
  size: '$4',
  variants: {
    head: {
      true: {
        fontWeight: '600',
      },
    },
  } as const,
})

export function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const colCount = headers.length
  const colWidth = `${100 / colCount}%` as `${number}%`

  return (
    <TableFrame>
      <TableRow>
        {headers.map((header, i) => (
          <TableCellContainer key={i} head width={colWidth}>
            <TableCellText head>{header}</TableCellText>
          </TableCellContainer>
        ))}
      </TableRow>
      {rows.map((row, i) => (
        <TableRow key={i} last={i === rows.length - 1}>
          {row.map((cell, j) => (
            <TableCellContainer key={j} width={colWidth}>
              <TableCellText>{cell}</TableCellText>
            </TableCellContainer>
          ))}
        </TableRow>
      ))}
    </TableFrame>
  )
}
