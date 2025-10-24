import React from 'react'
import { Text, View } from 'tamagui'
import { ButtonSimple } from '../buttons/ButtonSimple'

export function TimedRender(props: { children: any }) {
  const [key, setKey] = React.useState(0)
  const [time, setTime] = React.useState(0)

  return (
    <View self="center" justify="center" gap="$4" p="$4">
      <ButtonSimple theme="accent" onPress={() => setKey(Math.random())}>
        Re-render
      </ButtonSimple>
      <Text>Took: {time}ms</Text>
      <View flexDirection="column">
        <TimedRenderInner key={key} onComplete={setTime}>
          {props.children}
        </TimedRenderInner>
      </View>
    </View>
  )
}

export function TimedRenderInner({
  onComplete,
  children,
}: {
  onComplete: (time: number) => void
  children: any
}) {
  const [start] = React.useState(performance.now())

  React.useLayoutEffect(() => {
    onComplete(performance.now() - start)
  }, [onComplete, start])

  return children
}
