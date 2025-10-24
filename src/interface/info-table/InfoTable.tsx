import type { GetProps } from 'tamagui'
import { SizableText, styled, View, withStaticProperties } from 'tamagui'

const InfoTableFrame = styled(View, {
  width: '100%',
  gap: '$1',
  borderWidth: 1,
  borderColor: '$color3',
  rounded: '$4',
  px: '$4',
  py: '$2',
})

const InfoTableRow = styled(View, {
  flexDirection: 'row',
  width: '100%',
  gap: '$3',
  py: '$2',
  items: 'flex-start',
})

const InfoTableTerm = styled(SizableText, {
  flex: 0.33,
  minW: 0,
  color: '$color10',
  fontSize: '$3',
  lineHeight: '$3',
})

const InfoTableDefinition = styled(SizableText, {
  flex: 0.67,
  minW: 0,
  color: '$color11',
  fontSize: '$3',
  lineHeight: '$3',
})

type InfoTableData = {
  key: string
  term: string
  definition: string | React.ReactNode
}

type InfoTableProps = GetProps<typeof InfoTableFrame> & {
  data?: InfoTableData[]
}

const InfoTableComponent = ({ data, children, ...props }: InfoTableProps) => {
  return (
    <InfoTableFrame {...props}>
      {data
        ? data.map((item) => (
            <InfoTableRow key={item.key}>
              <InfoTableTerm>{item.term}</InfoTableTerm>
              <InfoTableDefinition>{item.definition}</InfoTableDefinition>
            </InfoTableRow>
          ))
        : children}
    </InfoTableFrame>
  )
}

export const InfoTable = withStaticProperties(InfoTableComponent, {
  Frame: InfoTableFrame,
  Row: InfoTableRow,
  Term: InfoTableTerm,
  Definition: InfoTableDefinition,
})
