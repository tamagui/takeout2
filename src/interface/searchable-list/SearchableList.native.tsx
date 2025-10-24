import { Input } from 'tamagui'

export const useSearchableList = () => {
  // todo
  return {} as any
}

export const SearchableListItem = ({
  children,
  index,
}: {
  children: (
    active: boolean,
    itemProps: Record<string, any>,
    key: string
  ) => React.JSX.Element
  index: number
}) => {
  // TODO
  return children(false, {}, '')
}

export const SearchableInput = (props: any) => {
  // TODO
  return <Input {...(props as any)} />
}
