import { SizableText, styled, XStack, YStack } from 'tamagui'
import { Link } from '~/interface/app/Link'
import { DiscordLogo, GithubLogoIcon, TwitterLogo } from './TakeoutIcons'

const TWITTER_URL = 'https://x.com/tamagui__js'
const GITHUB_URL = 'https://github.com/tamagui'
const DISCORD_URL = 'https://discord.gg'

const Container = styled(YStack, {
  gap: 16,
  mx: -5,
  items: 'center',
})

const SubTitle = styled(SizableText, {
  size: '4',
  self: 'center',
})

const IconLink = styled(XStack, {
  cursor: 'pointer',
  p: 8,
  opacity: 0.85,
  items: 'center',
  justify: 'center',
})

export const SocialLinksRow = ({ large }: { large?: boolean }) => {
  const scale = large ? 1.5 : 0.8

  return (
    <XStack pointerEvents="auto" items="center">
      <Link target="_blank" href={TWITTER_URL} aria-label="X (formerly Twitter)">
        <IconLink mr={-3}>
          <Container minW={large ? 60 : 45}>
            <TwitterLogo size={25 * scale} />
            {large && <SubTitle>X</SubTitle>}
          </Container>
        </IconLink>
      </Link>

      <Link target="_blank" href={GITHUB_URL} aria-label="GitHub">
        <IconLink>
          <Container minW={large ? 60 : 45} y={-1}>
            <GithubLogoIcon size={28 * scale} />
            {large && <SubTitle>Github</SubTitle>}
          </Container>
        </IconLink>
      </Link>

      {large && (
        <Link target="_blank" href={DISCORD_URL} aria-label="Discord">
          <IconLink>
            <Container minW={60}>
              <DiscordLogo size={25 * scale} />
              <SubTitle>Discord</SubTitle>
            </Container>
          </IconLink>
        </Link>
      )}
    </XStack>
  )
}
