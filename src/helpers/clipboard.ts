export const getClipboardText = async (): Promise<string | null> => {
  try {
    const text = await navigator.clipboard.readText()
    return text
  } catch {
    return null
  }
}
