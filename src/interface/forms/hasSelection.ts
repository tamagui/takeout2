export function hasSelection(target: HTMLElement) {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return target.selectionStart !== target.selectionEnd
  }
  return false
}
