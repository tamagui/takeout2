import { useParams } from 'one'
import AppInstallRender from '~/features/app/AppInstallRender'

export default function AppPage() {
  const { appInstallId } = useParams<{
    appInstallId: string
  }>()

  return <AppInstallRender appInstallId={appInstallId!} />
}
