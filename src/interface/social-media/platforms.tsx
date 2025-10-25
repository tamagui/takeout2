import type { FC } from 'react'
import { Linking } from 'react-native'
import { XStack, Button } from 'tamagui'

export interface SocialPlatform {
  name: string
  icon: string
  baseUrl: string
  color?: string
}

export const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
  twitter: {
    name: 'Twitter',
    icon: '𝕏',
    baseUrl: 'https://twitter.com/',
    color: '#000000',
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    baseUrl: 'https://instagram.com/',
    color: '#E4405F',
  },
  github: {
    name: 'GitHub',
    icon: '💻',
    baseUrl: 'https://github.com/',
    color: '#181717',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    baseUrl: 'https://linkedin.com/in/',
    color: '#0A66C2',
  },
}

interface SocialLinksProps {
  links?: Record<string, string>
  size?: 'small' | 'medium' | 'large'
}

export const SocialLinks: FC<SocialLinksProps> = ({ links, size = 'medium' }) => {
  if (!links || Object.keys(links).length === 0) return null

  const buttonSize = size === 'small' ? 32 : size === 'large' ? 48 : 40

  return (
    <XStack gap="$2" flexWrap="wrap">
      {Object.entries(links).map(([platform, username]) => {
        const platformInfo = SOCIAL_PLATFORMS[platform]
        if (!platformInfo || !username) return null

        const url = platformInfo.baseUrl + username

        return (
          <Button
            key={platform}
            size={buttonSize}
            circular
            onPress={() => Linking.openURL(url)}
            theme={platformInfo.color ? undefined : 'blue'}
          >
            {platformInfo.icon}
          </Button>
        )
      })}
    </XStack>
  )
}

export const getSocialUrl = (platform: string, username: string): string => {
  const platformInfo = SOCIAL_PLATFORMS[platform]
  if (!platformInfo) return ''
  return platformInfo.baseUrl + username
}
