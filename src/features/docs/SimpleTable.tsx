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

const TableCellFrame = styled(XStack, {
  p: '$3',
  flex: 1,
  flexBasis: 0,
  variants: {
    head: {
      true: {
        bg: '$color2',
      },
    },
  } as const,
})

export function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <TableFrame>
      <TableRow>
        {headers.map((header, i) => (
          <TableCellFrame key={i} head>
            <TableCellText head>{header}</TableCellText>
          </TableCellFrame>
        ))}
      </TableRow>
      {rows.map((row, i) => (
        <TableRow key={i} last={i === rows.length - 1}>
          {row.map((cell, j) => (
            <TableCellFrame key={j}>
              <TableCellText>{cell}</TableCellText>
            </TableCellFrame>
          ))}
        </TableRow>
      ))}
    </TableFrame>
  )
}
