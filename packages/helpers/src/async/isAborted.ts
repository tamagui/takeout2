export const isAborted = (controller?: AbortController): boolean =>
  !!controller?.signal.aborted
