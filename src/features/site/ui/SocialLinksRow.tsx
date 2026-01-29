import { useLinkTo, type LinkProps } from 'one'
import { SizableText, styled, View, XStack, YStack, type SizableTextProps } from 'tamagui'

import { GITHUB_URL, TWITTER_URL } from '~/constants/app'
import { GithubLogoIcon } from '~/interface/icons/GithubLogoIcon'
import { DiscordLogo } from '~/interface/social-media/DiscordLogo'
import { TwitterLogo } from '~/interface/social-media/TwitterLogo'

export const SocialLinksRow = ({ large }: { large?: boolean }) => {
  const scale = large ? 1.5 : 0.8

  return (
    <XStack pointerEvents="auto">
      <HoverableLink
        mr={-3}
        target="_blank"
        href={TWITTER_URL}
        aria-label="X (formerly Twitter)"
      >
        <Container minW={large ? 60 : 45}>
          <TwitterLogo size={25 * scale} aria-hidden={true} />
          <SubTitle display={large ? 'flex' : 'none'}>X</SubTitle>
        </Container>
      </HoverableLink>

      <HoverableLink target="_blank" href={GITHUB_URL} aria-label="GitHub">
        <Container minW={large ? 60 : 45} y={-1}>
          <GithubLogoIcon size={28 * scale} aria-hidden={true} />
          <SubTitle display={large ? 'flex' : 'none'}>Github</SubTitle>
        </Container>
      </HoverableLink>

      <View display={large ? 'flex' : 'none'}>
        <HoverableLink target="_blank" href="https://discord.gg" aria-label="Discord">
          <Container minW={large ? 60 : 45}>
            <DiscordLogo size={25 * scale} aria-hidden={true} />
            <SubTitle display={large ? 'flex' : 'none'}>Discord</SubTitle>
          </Container>
        </HoverableLink>
      </View>
    </XStack>
  )
}

const Container = styled(YStack, {
  gap: '$4',
  mx: -5,
  items: 'center',
})

const SubTitle = styled(SizableText, {
  size: '$4',
  self: 'center',
})

const HoverableLinkFrame = styled(SizableText, {
  render: 'a',
  cursor: 'pointer',
  p: '$2',
  opacity: 0.85,
  textDecorationColor: 'transparent',
  items: 'center',
  justify: 'center',
  display: 'inline-flex',

  hoverStyle: {
    opacity: 1,
  },
})

const HoverableLink = (props: SizableTextProps & LinkProps) => {
  const linkProps = useLinkTo({ href: props.href as any, replace: props.replace })

  return <HoverableLinkFrame {...linkProps} {...props} />
}
