import Fuse, { type FuseSearchOptions, type IFuseOptions } from 'fuse.js'

export type FuzzyOptions = IFuseOptions<unknown>

// fuse does some insane staleness in getFn that doesn't make sense so pulled it all the way out here
let lastSearch = ''

export function createFuzzy<
  A extends Record<string, any>,
  Results extends A[] | readonly A[],
>(
  items: Results,
  options?: IFuseOptions<A>
): {
  search: (val: string, options?: FuseSearchOptions) => Results
} {
  const fuse = new Fuse(items, {
    isCaseSensitive: false,
    threshold: 0.5,
    ...options,
    getFn(obj, path, ...rest) {
      if (obj.skipFuzzy) {
        return lastSearch
      }
      return Fuse.config.getFn(obj, path)
    },
  })

  return {
    search: (val: string, options?: FuseSearchOptions): Results => {
      if (!val) {
        return items
      }
      lastSearch = val
      const results = fuse.search(val, options).map((result) => result.item)
      return results as Results
    },
  }
}
