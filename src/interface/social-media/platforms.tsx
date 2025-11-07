import type { ComponentType, FC } from 'react'
import { TwitterLogo } from './TwitterLogo'
import { InstagramLogo } from './InstagramLogo'
import { TikTokLogo } from './TikTokLogo'
import { FacebookLogo } from './FacebookLogo'
import { YoutubeLogo } from './YoutubeLogo'
import { TwitchLogo } from './TwitchLogo'
import { SnapchatLogo } from './SnapchatLogo'
import { DiscordLogo } from './DiscordLogo'
import { View, XStack } from 'tamagui'
import { Linking } from 'react-native'
import { memo } from 'react'
import { ButtonSimple } from '../buttons/ButtonSimple'

export interface SocialPlatform {
  id:
    | 'twitter'
    | 'instagram'
    | 'tiktok'
    | 'facebook'
    | 'youtube'
    | 'twitch'
    | 'snapchat'
    | 'discord'
  name: string
  displayName: string
  icon: ComponentType<{ size?: number }>
  baseUrl: string
  color?: string
}

export const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
  twitter: {
    id: 'twitter',
    name: 'twitter',
    displayName: 'X (Twitter)',
    icon: TwitterLogo,
    baseUrl: 'https://x.com',
    color: '#000000',
  },
  instagram: {
    id: 'instagram',
    name: 'instagram',
    displayName: 'Instagram',
    icon: InstagramLogo,
    baseUrl: 'https://instagram.com',
    color: '#E4405F',
  },
  tiktok: {
    id: 'tiktok',
    name: 'tiktok',
    displayName: 'TikTok',
    icon: TikTokLogo,
    baseUrl: 'https://tiktok.com',
    color: '#000000',
  },
  facebook: {
    id: 'facebook',
    name: 'facebook',
    displayName: 'Facebook',
    icon: FacebookLogo,
    baseUrl: 'https://facebook.com',
    color: '#1877F2',
  },
  youtube: {
    id: 'youtube',
    name: 'youtube',
    displayName: 'YouTube',
    icon: YoutubeLogo,
    baseUrl: 'https://youtube.com',
    color: '#FF0000',
  },
  twitch: {
    id: 'twitch',
    name: 'twitch',
    displayName: 'Twitch',
    icon: TwitchLogo,
    baseUrl: 'https://twitch.com',
    color: '#9146FF',
  },
  snapchat: {
    id: 'snapchat',
    name: 'snapchat',
    displayName: 'Snapchat',
    icon: SnapchatLogo,
    baseUrl: 'https://snapchat.com',
    color: '#FFFC00',
  },
  discord: {
    id: 'discord',
    name: 'discord',
    displayName: 'Discord',
    icon: DiscordLogo,
    baseUrl: 'https://discord.gg',
    color: '#5865F2',
  },
}

interface SocialLinksProps {
  links?: Record<string, string>
  size?: 'small' | 'medium' | 'large'
}

export const SocialLinks = memo(({ links, size = 'medium' }: SocialLinksProps) => {
  if (!links || Object.keys(links).length === 0) return null

  const buttonSize = size === 'small' ? 32 : size === 'large' ? 48 : 40

  return (
    <XStack gap="$2" flexWrap="wrap">
      {Object.entries(links).map(([platform, username], index) => {
        console.info('index', index)
        const platformInfo = SOCIAL_PLATFORMS[platform]
        if (!platformInfo || !username) return null

        const url = platformInfo.baseUrl + username

        const Icon = platformInfo.icon
        const iconSize = Math.round(buttonSize * 0.5)

        return (
          <View key={platform} ml={index > 0 ? -16 : 0}>
            <ButtonSimple
              onPress={() => Linking.openURL(url)}
              size="large"
              circular
              glass
            >
              <Icon size={iconSize} />
            </ButtonSimple>
          </View>
        )
      })}
    </XStack>
  )
})

export const getSocialUrl = (platform: string, username: string): string => {
  const platformInfo = SOCIAL_PLATFORMS[platform]
  if (!platformInfo) return ''
  return platformInfo.baseUrl + username
}
