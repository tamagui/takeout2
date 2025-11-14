import { useLinkTo, type LinkProps } from 'one'
import { SizableText, styled, View, YStack, type SizableTextProps } from 'tamagui'
import { DiscordIcon } from '~/interface/icons/DiscordIcon'
import { GithubLogoIcon } from '~/interface/icons/GithubLogoIcon'
import { XIcon } from '~/interface/icons/XIcon'

export const SocialLinksRow = ({ large }: { large?: boolean }) => {
  const scale = large ? 1.5 : 0.8

  return (
    <>
      <HoverableLink
        mr={-3}
        target="_blank"
        href="https://x.com"
        aria-label="X (formerly Twitter)"
      >
        <Container minW={large ? 60 : 45}>
          <XIcon
            size={44 * scale}
            style={{
              marginBottom: -10 * scale,
              marginTop: -10 * scale,
              marginLeft: -11 * scale,
              marginRight: -11 * scale,
            }}
            aria-hidden={true}
          />
          <SubTitle display={large ? 'flex' : 'none'}>X</SubTitle>
        </Container>
      </HoverableLink>

      <HoverableLink target="_blank" href="https://github.com" aria-label="GitHub">
        <Container minW={large ? 60 : 45} y={-1}>
          <GithubLogoIcon size={28 * scale} aria-hidden={true} />
          <SubTitle display={large ? 'flex' : 'none'}>Github</SubTitle>
        </Container>
      </HoverableLink>

      <View
        display={large ? 'flex' : 'none'}
        $group-card-gtXs={{ display: 'inline-flex' }}
      >
        <HoverableLink target="_blank" href="https://discord.gg" aria-label="Discord">
          <Container minW={large ? 60 : 45}>
            <DiscordIcon size={25 * scale} aria-hidden={true} />
            <SubTitle display={large ? 'flex' : 'none'}>Discord</SubTitle>
          </Container>
        </HoverableLink>
      </View>
    </>
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

const HoverableLinkStyled = styled(SizableText, {
  tag: 'a',
  cursor: 'pointer',
  p: '$2',
  px: '$3',
  opacity: 0.66,
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

  return <HoverableLinkStyled {...linkProps} {...props} />
}
