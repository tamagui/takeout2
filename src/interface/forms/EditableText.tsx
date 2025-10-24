import { memo } from 'react'
import { SizableText, type SizableTextProps, useControllableState } from 'tamagui'
import { useHandleEscapeIf } from '~/features/shortcuts/handleKeyboardEscape'
import { getEditableInputProps } from './getEditableInputProps'
import { InputChromeless } from './InputChromeless'

interface EditableTextProps extends SizableTextProps {
  value: string
  onEditComplete: (value: string) => void
  inputProps?: any
  editing?: boolean
  onEditingChange?: (editing: boolean) => void
}

export const EditableText = memo(
  ({
    value,
    onEditComplete,
    inputProps = {},
    editing: controlledEditing,
    onEditingChange,
    fontFamily,
    size,
    lineHeight,
    ...textProps
  }: EditableTextProps) => {
    const [editing, setEditing] = useControllableState({
      prop: controlledEditing,
      onChange: onEditingChange,
      defaultProp: false,
    })

    useHandleEscapeIf(editing, () => setEditing(false))

    if (editing) {
      return (
        <InputChromeless
          fontFamily={fontFamily}
          size={size}
          flex={10}
          autoFocus
          mx={-16.5}
          mt={-12}
          y={-0.5}
          mb={-11}
          defaultValue={value}
          {...textProps}
          {...inputProps}
          {...getEditableInputProps({
            onEditCancel: () => setEditing(false),
            onEditComplete: (value) => {
              setEditing(false)
              onEditComplete(value)
            },
            originalValue: value,
          })}
        />
      )
    }

    return (
      <SizableText
        fontFamily={fontFamily}
        size={size}
        lineHeight={lineHeight}
        flex={0.6}
        // @ts-expect-error
        onDoubleClick={(e) => {
          e.preventDefault()
          setEditing(true)
        }}
        ellipse
        select="none"
        cursor="default"
        {...textProps}
      >
        {value}
      </SizableText>
    )
  }
)
