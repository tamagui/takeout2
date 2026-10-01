import { H5, Paragraph, View, YStack, type YStackProps } from 'tamagui'
import type { ReactNode } from 'react'

type InfoCardProps = YStackProps & {
  title: string
  icon: ReactNode
  children: ReactNode
}

export function InfoCard({ title, icon, children, ...props }: InfoCardProps) {
  return (
    <YStack
      render="a"
      {...props}
      width="100% md:calc(50% - 12px)"
      gap={7}
      mb="7px md:18px"
      py={18}
      px={7}
    >
      <View self="flex-end" mb={-26} opacity={0.25}>
        {icon}
      </View>
      <H5 fontFamily="takeout-mono" size="5" mt={-10}>
        {title}
      </H5>
      <Paragraph fontFamily="takeout-body" mr={32} size="5" color="color-9">
        {children}
      </Paragraph>
    </YStack>
  )
}
