// note safari enhanced privacy will break this as it reports screen height as smaller

export function openCenteredPopup(
  url: string,
  title: string,
  width: number,
  height: number
): Window | null {
  // availWidth/availHeight accounts for taskbars, docks, and other UI elements
  const screenWidth = screen.availWidth || screen.width
  const screenHeight = screen.availHeight || screen.height

  const shouldGuess = screenHeight < height

  // if we are guessing, at least make it a bit more likely to be centered
  // and not just touching the top which looks broken
  const left = Math.max(0, (screenWidth - width) / 2) + (shouldGuess ? 100 : 0)
  const top = Math.max(150, shouldGuess ? 150 : Math.max(0, (screenHeight - height) / 2))

  const windowFeatures = `
    width=${width},
    height=${height},
    left=${left},
    top=${top},
    scrollbars=yes,
    resizable=yes
  `

  return window.open(url, title, windowFeatures)
}
