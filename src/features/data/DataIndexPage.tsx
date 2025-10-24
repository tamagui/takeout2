import { memo, useCallback } from 'react'
import { Square, Theme } from 'tamagui'
import {
  DataTable,
  defaultRenderCellContent,
  YStack,
  type TableCellRenderer,
} from '~/interface/start-ui'
import { AppIconImage } from '../apps/ui/AppIcon'
import { useCurrentServer } from '../server/useCurrentServer'
import { TOP_BAR_HEIGHT } from '~/interface/constants'

export const DataIndexPage = memo(() => {
  const { server } = useCurrentServer()
  const serverApps = server?.apps || []

  const renderDataTableCell: TableCellRenderer = useCallback(
    (props) => {
      if (props.columnKey === 'app') {
        const appInstallId = props.item.appInstallId
        const app = serverApps.find((app) => app.install?.id === appInstallId)
        return app ? (
          <Theme name={app.meta?.theme || null}>
            <Square size={26} bg="$color2" rounded="$4" mx="auto">
              <AppIconImage size={16} app={app} />
            </Square>
          </Theme>
        ) : null
      }

      return defaultRenderCellContent(props)
    },
    [serverApps]
  )

  return (
    <YStack flex={1} mt={TOP_BAR_HEIGHT}>
      <DataTable renderCellContent={renderDataTableCell} />
    </YStack>
  )
})
