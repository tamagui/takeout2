import { SizableText, YStack } from 'tamagui'

import { H1 } from '~/interface/text/Headings'

import type { ReactNode } from 'react'

type LegalPageProps = {
  title: string
  children: ReactNode
}

export const LegalPage = ({ title, children }: LegalPageProps) => {
  return (
    <YStack gap="$4" maxW={760}>
      <H1>{title}</H1>
      <SizableText size="$3" color="$color11">
        Last updated:{' '}
        {new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </SizableText>

      <YStack gap="$4" mt="$4">
        {children}
      </YStack>
    </YStack>
  )
}

type LegalSectionProps = {
  title: string
  children: ReactNode
}

export const LegalSection = ({ title, children }: LegalSectionProps) => {
  return (
    <YStack gap="$2">
      <SizableText size="$5" fontWeight="600" color="$color12">
        {title}
      </SizableText>
      {children}
    </YStack>
  )
}

export const LegalText = ({ children }: { children: ReactNode }) => {
  return (
    <SizableText size="$4" color="$color12" lineHeight="$4">
      {children}
    </SizableText>
  )
}

export const LegalList = ({ children }: { children: ReactNode }) => {
  return (
    <YStack gap="$2" pl="$4">
      {children}
    </YStack>
  )
}
