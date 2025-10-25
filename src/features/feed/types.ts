export type FeedPlatform = 'twitter' | 'instagram' | 'tiktok'

export interface BaseFeedItem {
  id: string
  platform: FeedPlatform
  avatarUrl: string
  username: string
  displayName: string
  earnings?: number
  verified?: boolean
}

export interface TwitterFeedItem extends BaseFeedItem {
  platform: 'twitter'
  content: string
  timestamp: string
  likes: number
  retweets: number
  replies: number
  views: number
  imageUrl?: string
}

export interface InstagramFeedItem extends BaseFeedItem {
  platform: 'instagram'
  imageUrl: string
  location?: string
  caption?: string
  likes: number
  comments: number
}

export interface TikTokFeedItem extends BaseFeedItem {
  platform: 'tiktok'
  videoThumbnail: string
  videoUrl: string
  caption: string
  likes: number
  comments: number
  shares: number
  views: number
}

export type FeedItem = TwitterFeedItem | InstagramFeedItem | TikTokFeedItem

export const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

export const formatEarnings = (amount: number): string => {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`
  }
  return `$${amount}`
}
