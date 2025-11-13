import { H5, Paragraph, YStack, styled } from 'tamagui'
import type { ComponentType } from 'react'

interface InfoCardProps {
  title: string
  Icon: ComponentType<any>
  children: React.ReactNode
}

const CardContainer = styled(YStack, {
  position: 'relative',
  width: 'calc(50% - 12px)',
  mb: '$4',
  py: '$2',

  $maxSM: {
    width: '100%',
    mb: '$2',
  },
})

const IconWrapper = styled(YStack, {
  gap: '$2',
  p: '$4',
})

export const InfoCard = ({ title, Icon, children }: InfoCardProps) => {
  return (
    <CardContainer>
      <YStack fullscreen opacity={0.25} />
      <IconWrapper>
        <Icon self="flex-end" mb={-20} opacity={0.1} size={28} />
        <H5 fontFamily="$mono" size="$2" color="$color12" mt={-10}>
          {title}
        </H5>
        <Paragraph color="$color11">{children}</Paragraph>
      </IconWrapper>
    </CardContainer>
  )
}
