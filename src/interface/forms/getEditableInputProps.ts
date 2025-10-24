interface EditableInputOptions {
  onEditCancel?: () => void
  onEditComplete?: (value: string) => void | Promise<void>
  originalValue?: string
  setEditing?: React.Dispatch<React.SetStateAction<boolean>>
  forceEditing?: boolean
}

export function getEditableInputProps({
  onEditCancel,
  onEditComplete,
  originalValue,
  setEditing,
  forceEditing,
}: EditableInputOptions) {
  return {
    onKeyPress: (e: {
      preventDefault: () => void
      stopPropagation: () => void
      nativeEvent: { key: string }
    }) => {
      if (e.nativeEvent.key === 'Escape') {
        if (onEditCancel) {
          e.preventDefault()
          e.stopPropagation()
          onEditCancel()
        }
      }
    },

    onSubmitEditing: (e: { nativeEvent: { text: string } }) => {
      if (!forceEditing) {
        setEditing?.(false)
      }
      onEditComplete?.(e.nativeEvent.text)
    },

    onBlur: (e: any) => {
      // TODO tamagui - nativeEvent is wrong
      const val = (e.target as any)['value']

      if (!val || val === originalValue) {
        if (!forceEditing) {
          setEditing?.(false)
        }
        onEditCancel?.()
      }
    },
  }
}
