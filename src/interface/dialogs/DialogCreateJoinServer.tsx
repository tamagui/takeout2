import { redirect } from 'one'
import { useState } from 'react'
import { YStack } from 'tamagui'
import { CreateServerForm } from '~/features/server/CreateServerForm'
import { ButtonAction } from '../buttons/ButtonAction'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { Tabs } from '../tabs/Tabs'
import { DropAreaFrame } from '../upload/DragDropFile'
import { serverDialogEmitter } from './actions'
import { AlwaysVisibleTabContent } from './AlwaysVisibleTabContent'
import { Dialog, useDialogOpen } from './Dialog'
import { DialogJoinServerContent } from './DialogJoinServerContent'
import { useDialogEmit } from './shared'
import type { TabContentPaneProps } from './types'

const success = () => serverDialogEmitter.emit(true)
const cancel = () => serverDialogEmitter.emit(false)

export const DialogCreateJoinServer = () => {
  const [show, setShow] = useState(false)
  const [tab, setTab] = useState('create')

  useDialogEmit((next) => {
    if (next.type === 'create-server' || next.type === 'join-server') {
      setShow(true)
      setTab(next.type === 'create-server' ? 'create' : 'join')
    } else {
      setShow(false)
    }
  })

  return (
    <Dialog
      onOpenChange={(next) => {
        setShow(next)
        if (!next) {
          cancel()
        }
      }}
      open={show}
      minH={400}
    >
      <DropAreaFrame>
        <Tabs
          initialTab={tab}
          onValueChange={setTab}
          tabs={[
            { label: 'Create Server', value: 'create' },
            { label: 'Join Server', value: 'join' },
          ]}
        >
          <YStack position="relative" flex={1} width="100%">
            <DialogCreateServerContent value="create" active={tab} setShow={setShow} />
            <DialogJoinServerContent value="join" active={tab} setShow={setShow} />
          </YStack>
        </Tabs>
      </DropAreaFrame>
    </Dialog>
  )
}

const DialogCreateServerContent = ({ setShow, ...props }: TabContentPaneProps) => {
  const isActive = props.active === props.value
  const dialogOpen = useDialogOpen()

  const handleComplete = (serverId: string) => {
    setShow(false)
    redirect(`/${serverId}`)
    success()
  }

  return (
    <AlwaysVisibleTabContent {...props}>
      <CreateServerForm
        onComplete={handleComplete}
        autoFocus={isActive}
        dropActive={dialogOpen && isActive}
        cancelButton={
          <Dialog.Close asChild>
            <ButtonSimple
              onPress={() => {
                setShow(false)
                cancel()
              }}
            >
              Cancel
            </ButtonSimple>
          </Dialog.Close>
        }
      />
    </AlwaysVisibleTabContent>
  )
}
