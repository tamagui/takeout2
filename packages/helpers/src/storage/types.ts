export interface StorageDriver {
  getItem(key: string): string | null | undefined
  setItem(key: string, value: string): void
  removeItem(key: string): void
  getAllKeys(): string[]
}
