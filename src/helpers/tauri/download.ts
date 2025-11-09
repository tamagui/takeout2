import { isTauri } from '@take-out/helpers'

async function saveInTauri(data: string | Blob, filename: string) {
  const { save } = await import('@tauri-apps/plugin-dialog')
  const { writeTextFile, writeFile } = await import('@tauri-apps/plugin-fs')

  const extension = filename.split('.').pop() || ''
  const filePath = await save({
    defaultPath: filename,
    filters: [
      {
        name: `${extension.toUpperCase()} files`,
        extensions: [extension],
      },
    ],
  })

  if (filePath) {
    if (typeof data === 'string') {
      await writeTextFile(filePath, data)
    } else {
      const arrayBuffer = await data.arrayBuffer()
      await writeFile(filePath, new Uint8Array(arrayBuffer))
    }
  }
}

function downloadInBrowser(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export async function downloadFile(
  data: string,
  filename: string,
  mimeType = 'application/json'
) {
  if (isTauri) {
    await saveInTauri(data, filename)
  } else {
    const blob = new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    downloadInBrowser(url, filename)
    URL.revokeObjectURL(url)
  }
}

export async function downloadFromUrl(url: string, filename?: string) {
  const resolvedFilename = filename || url.split('/').pop() || 'download'

  if (isTauri) {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      await saveInTauri(blob, resolvedFilename)
    } catch (error) {
      console.error('Failed to download file:', error)
      downloadInBrowser(url, resolvedFilename)
    }
  } else {
    downloadInBrowser(url, resolvedFilename)
  }
}
