import { useId, useState } from 'react'

const IDForStack = new Map<string, string>()

export const EnsureStableId = ({ name }: { name: string }) => {
  const id = useId()
  const [stack] = useState<string>(() => '')

  // useEffect(() => {
  //   const existing = IDForStack.get(stack)
  //   if (existing && existing !== id) {
  //     console.error(
  //       `‼️ [EnsureStableId] ${name} failed, id changed: (${existing} => ${id})\n\n   ${getCurrentComponentStack('short')}\n\n`
  //     )
  //   } else {
  //     IDForStack.set(stack, id)
  //   }
  // }, [id, name, stack])

  return null
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    IDForStack.clear()
  })
}
