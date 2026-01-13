import {
  createEmitter,
  createGlobalContext,
  uniqBy,
  useEmitterValue,
} from '@take-out/helpers'
import {
  memo,
  type ReactElement,
  use,
  useCallback,
  useEffect,
  useId,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import {
  Paragraph,
  useDidFinishSSR,
  useEvent,
  View,
  type ViewProps,
  YStack,
} from 'tamagui'

import { ImageIcon } from '~/interface/icons/phosphor/ImageIcon'

import { getFileType, isSupportedFile } from './helpers'
import {
  ProvideUploadFiles,
  type UploadFilesCallback,
  useUploadFiles,
} from './uploadFile'

import type { Component } from '../types'
import type { FileUpload } from './types'

export const attachmentEmitter = createEmitter<FileUpload[]>('attachment', [])

const childrenDropAreas = new Set<string>()
const childrenDropAreasCount = createEmitter<number>('childrenDropAreasCount', 0)

type DropAreaProps = { active?: boolean; onDropped?: UploadFilesCallback }

type DropAreaValue = {
  uploads: FileUpload[]
  isDropping: boolean
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  dropOverlay: ReactElement | null
  viewProps: ViewProps | null
  clear: () => void
}

const DropAreaContext = createGlobalContext<DropAreaValue | null>(
  'upload/drop-area',
  null
)

/**
 * Use this if you want to add a frame around a larger area for dropping.
 * You can use `useDropArea` inside this frame to access the state of the drop.
 */
export const DropAreaFrame = ({ children }: { children: any }) => {
  const value = useDropArea({}, true)

  return (
    <DropAreaContext.Provider
      value={{
        ...value,
        // we are handling this now
        viewProps: null,
        dropOverlay: null,
      }}
    >
      {value.dropOverlay}
      <View display="contents" {...value.viewProps}>
        {children}
      </View>
    </DropAreaContext.Provider>
  )
}

/**
 * Automatically replaces the parent DragDropFile whenever this is mounted
 */
export const useDropArea = (
  { onDropped, active = true }: DropAreaProps = {},
  isFrame = false
): DropAreaValue => {
  const context = use(DropAreaContext)

  const id = useId()
  const [isDroppingHere, setIsDropping] = useState(false)
  const isDropping = context?.isDropping ?? isDroppingHere
  const onDroppedEvent = useEvent(onDropped)
  const { uploads, handleUpload, handleFileChange, clear } = useUploadFiles({
    onChange: onDroppedEvent,
  })

  useEffect(() => {
    if (!active) return
    if (!onDroppedEvent) return
    if (context?.uploads?.length) {
      onDroppedEvent(context?.uploads)
    }
    if (uploads?.length) {
      onDroppedEvent(uploads)
    }
  }, [active, context?.uploads, onDroppedEvent, uploads, uploads?.length])

  useEffect(() => {
    if (isFrame) return // assume we always have a child when rendering a frame
    if (!active) return
    childrenDropAreas.add(id)
    childrenDropAreasCount.emit(childrenDropAreas.size)
    return () => {
      childrenDropAreas.delete(id)
      childrenDropAreasCount.emit(childrenDropAreas.size)
    }
  }, [active, id, isFrame])

  return {
    clear: () => {
      clear()
      context?.clear?.()
    },
    uploads: uploads ?? context?.uploads,
    isDropping,
    handleFileChange: handleFileChange ?? context?.handleFileChange,
    dropOverlay: context ? null : <DropOverlay hidden={!isDropping} />,
    viewProps: context
      ? null
      : {
          // @ts-expect-error its ok it passes:
          onDrop: (event: DragEvent<HTMLDivElement>) => {
            if (isDragFromWithinBrowser(event)) {
              return
            }

            event.preventDefault()
            event.stopPropagation()
            setIsDropping(false)
            const file = event.dataTransfer.files[0]
            if (file) {
              handleUpload([file])
            }
          },
          onDragOver: (e: any) => {
            if (isDragFromWithinBrowser(e)) {
              return
            }

            setIsDropping(true)
            e.preventDefault()
            e.stopPropagation()
          },
          onDragLeave: () => {
            setIsDropping(false)
          },
        },
  }
}

export const DragDropFile = (props: { children: any }) => {
  const dropAreasCount = useEmitterValue(childrenDropAreasCount) || 0
  const hasChildrenDropAreas = dropAreasCount > 0
  const [state, setState] = useState<DragDropEvent | null>(null)
  const [uploading, setUploading] = useState<FileUpload[]>([])
  const isMounted = useDidFinishSSR()

  const uploadFiles = useUploadFiles({
    onChange: (uploads: FileUpload[]) => {
      attachmentEmitter.emit(
        uploads.map((upload) => {
          const existingUpload = uploading.find((u) => u.file.name === upload.name)
          return {
            ...upload,
            preview: existingUpload?.preview || upload.preview,
          }
        })
      )
    },
  })

  useDragDrop({
    selector: 'body',
    onChange: useCallback(
      (event) => {
        if (hasChildrenDropAreas) {
          return
        }

        setState(event)

        if (event.type === 'drop') {
          const attachmentFiles = uniqBy(event.files, (x) => x.name).flatMap(
            ({ name, contents, preview, id }) => {
              if (!isSupportedFile(name)) {
                return []
              }
              return [
                {
                  uid: id,
                  file: new File([contents as any], name),
                  type: getFileType(name),
                  name,
                  size: contents.length,
                  progress: 0,
                  status: 'uploading' as const,
                  preview,
                },
              ]
            }
          )

          setUploading(attachmentFiles)
          uploadFiles.handleUpload(attachmentFiles.map((f) => f.file))
        }
      },
      [uploadFiles, hasChildrenDropAreas]
    ),
  })

  const hidden =
    hasChildrenDropAreas || !state || state.type === 'cancel' || state.type === 'drop'

  if (typeof document === 'undefined') {
    return props.children // TODO: native
  }

  return (
    <ProvideUploadFiles value={uploadFiles}>
      {isMounted && createPortal(<DropOverlay hidden={hidden} />, document.body)}
      {props.children}
    </ProvideUploadFiles>
  )
}

export const DropOverlay: Component<{ hidden: boolean }> = memo(({ hidden }) => {
  return (
    <YStack
      position="absolute"
      inset={0}
      z={Number.MAX_SAFE_INTEGER}
      items="center"
      justify="center"
      transition="medium"
      bg="$shadow4"
      opacity={hidden ? 0 : 1}
      backdropFilter="blur(10px)"
      pointerEvents="none"
    >
      {hidden ? null : (
        <YStack items="center" justify="center" gap="$4">
          <ImageIcon size={30} color="$color" />
          <Paragraph fontFamily="$mono" size="$5" color="#fff">
            Drop to upload
          </Paragraph>
        </YStack>
      )}
    </YStack>
  )
})

export type DropFile = {
  id: string
  name: string
  contents: Uint8Array<ArrayBufferLike>
  preview?: string
}

export type DropEvent = {
  type: 'drop'
  files: DropFile[]
}

export type DragDropEvent =
  | {
      type: 'drag'
      x: number
      y: number
    }
  | DropEvent
  | {
      type: 'cancel'
    }

// why does putting this inside useEffect cause it to break? i verified its in the same scope and not unmounted...
let lastDropPaths: string[] = []

/**
 * Check if a drag event originated from within the browser (vs external file system)
 */
function isDragFromWithinBrowser(e: DragEvent): boolean {
  // disable as its not working
  return false
}

export const useDragDrop = ({
  onChange,
  selector,
}: {
  onChange: (e: DragDropEvent) => void
  selector?: string
}) => {
  const [internalNode, setNode] = useState<HTMLDivElement | null>(null)
  const onChangeCb = useEvent(onChange)

  useEffect(() => {
    if (typeof document === 'undefined') {
      return // TODO: native
    }

    const node = selector
      ? (document.querySelector(selector) as HTMLElement | undefined)
      : internalNode

    if (!node) return

    const controller = new AbortController()
    const { signal } = controller

    node.addEventListener(
      'dragover',
      (e) => {
        if (isDragFromWithinBrowser(e)) {
          return
        }

        e.preventDefault()
        e.stopPropagation()
        onChangeCb({
          type: 'drag',
          x: e.clientX,
          y: e.clientY,
        })
      },
      { signal }
    )

    node.addEventListener(
      'dragleave',
      (e) => {
        if (isDragFromWithinBrowser(e)) {
          return
        }

        e.preventDefault()
        e.stopPropagation()
        onChangeCb({
          type: 'cancel',
        })
      },
      { signal }
    )

    node.addEventListener(
      'drop',
      async (e) => {
        if (isDragFromWithinBrowser(e)) {
          return
        }

        e.preventDefault()
        e.stopPropagation()

        const files: DropFile[] = []

        for (const item of Array.from(e.dataTransfer!.files)) {
          const fileName = item.name
          const fileSize = item.size
          const fileType = item.type
          const lastModified = item.lastModified

          try {
            files.push({
              id: `${fileName}-${fileSize}-${lastModified}-${fileType}`,
              name: item.name,
              contents: new Uint8Array(await item.arrayBuffer()),
              preview: await fileLikeToDataURI(item),
            })
          } catch (err) {
            console.error('Failed to read dropped file:', err)
          }
        }

        onChangeCb({
          type: 'drop',
          files,
        })
      },
      { signal }
    )

    return () => controller.abort()
  }, [internalNode, onChangeCb, selector])

  return {
    createDropElement: (props?: React.HTMLAttributes<HTMLDivElement>) => {
      return (
        <div
          id="drag-drop-root"
          ref={setNode}
          {...props}
          style={{
            minWidth: '100vw',
            minHeight: '100vh',
            inset: 0,
            pointerEvents: 'auto',
            overflow: 'hidden',
            ...props?.style,
          }}
        />
      )
    },
  }
}

async function fileLikeToDataURI(
  file: File | { name: string; contents: Uint8Array<ArrayBufferLike> }
) {
  const contents =
    'contents' in file ? file.contents : new Uint8Array(await file.arrayBuffer())
  return arrayBufferToDataURL(contents, getFileType(file.name))
}

function arrayBufferToDataURL(buffer: Uint8Array, mimeType: string): string {
  const chunkSize = 65536
  let base64 = ''

  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.subarray(i, i + chunkSize)
    base64 += String.fromCharCode(...chunk)
  }

  return `data:${mimeType};base64,${btoa(base64)}`
}
