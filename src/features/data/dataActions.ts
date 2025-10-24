import { searchActions } from '~/features/search/searchActions'
import {
  dataToSearchDocument,
  mergedDataToSearchDocument,
  partialDataToSearchDocument,
} from '~/features/search/helpers/data'
import type { SearchAddOptions } from '~/features/search/types'
import type { Data } from '~/data/types'
import { shouldIndexData } from './shouldIndexData'

export const dataActions = {
  async addToSearch(data: Data, options?: SearchAddOptions | boolean) {
    if (!shouldIndexData(data)) {
      return
    }

    const doc = dataToSearchDocument(data)
    await searchActions.add(doc, options)
  },

  async updateSearch(data: Partial<Data> & { id: string }) {
    if (!shouldIndexData(data)) {
      return
    }

    const doc =
      data.key && data.value
        ? mergedDataToSearchDocument(data)
        : partialDataToSearchDocument(data)
    await searchActions.update(doc)
  },

  async removeFromSearch(id: string) {
    await searchActions.remove(id)
  },
} as const

export type DataActions = typeof dataActions
