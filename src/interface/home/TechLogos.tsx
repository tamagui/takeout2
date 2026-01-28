import { View, XStack } from 'tamagui'

import { Link } from '~/interface/app/Link'
import { OneLogo } from '~/interface/icons/logos/OneLogo'
import { TamaguiLogo } from '~/interface/icons/logos/TamaguiLogo'
import { ZeroLogo } from '~/interface/icons/logos/ZeroLogo'

import { Tooltip } from '../tooltip/Tooltip'

const LOGO_SIZE = 32

const logos = [
  {
    name: 'Tamagui',
    href: 'https://tamagui.dev',
    Logo: TamaguiLogo,
  },
  {
    name: 'One',
    href: 'https://onestack.dev',
    Logo: OneLogo,
  },
  {
    name: 'Zero',
    href: 'https://zero.rocicorp.dev',
    Logo: ZeroLogo,
  },
] as const

export function TechLogos() {
  return (
    <XStack items="center" justify="center">
      {logos.map(({ name, href, Logo }) => (
        <Tooltip key={name} groupId="tech-logos" label={name}>
          <Link href={href} target="_blank" hideExternalIcon>
            <View
              transition="quick"
              opacity={0.7}
              px="$4"
              hoverStyle={{ opacity: 1, scale: 1.1 }}
              pressStyle={{ scale: 0.95 }}
              cursor="pointer"
            >
              <Logo size={LOGO_SIZE} />
            </View>
          </Link>
        </Tooltip>
      ))}
    </XStack>
  )
}
