export function shouldIndexData(data: { permissions?: string }): boolean {
  return data.permissions !== 'private'
}
