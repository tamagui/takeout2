// Stub unfurl module - simplified for starter kit
export interface UnfurlResult {
  title?: string
  description?: string
  image?: string
  url: string
}

export const unfurlUrl = async (url: string): Promise<UnfurlResult | null> => {
  // Stub implementation - would normally fetch and parse meta tags
  return {
    url,
    title: 'Link',
    description: url,
  }
}
