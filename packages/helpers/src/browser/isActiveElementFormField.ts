export function isActiveElementFormField(): boolean {
  return (
    typeof document !== 'undefined' &&
    document.activeElement !== null &&
    (document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'TEXTAREA' ||
      document.activeElement.tagName === 'SELECT' ||
      document.activeElement.tagName === 'FORM')
  )
}
