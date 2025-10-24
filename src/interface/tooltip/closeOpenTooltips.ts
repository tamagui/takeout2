import { closeOpenTooltips as tgcot } from 'tamagui'

export function closeOpenTooltips() {
  tgcot()

  // why - because oftentimes we click to open a popover *just* before tooltip opens
  // its never the case we want a tooltip to come in 100ms after we request to close anyway
  setTimeout(() => {
    tgcot()
  }, 100)
}
