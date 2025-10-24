import { useActiveParams, useParams } from 'one'
import type { AppRouteParams } from '../app/getAppParams'

export const useServerParams = ({ active }: { active?: boolean } = {}) => {
  return (active ? useActiveParams : useParams)<AppRouteParams>()
}
