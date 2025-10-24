import { H2, H3, Paragraph, Separator, Spacer, TextArea, YStack } from 'tamagui'
import { ContainerLarge } from '~/features/website/Container'
import { Hero } from '~/features/website/Hero'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Input } from '~/interface/forms/Input'
import { LabeledGroup } from '~/interface/forms/LabeledGroup'
import { Select } from '~/interface/select/Select'

export default function PrivateBetaPage() {
  return (
    <>
      <div className="body-scrollable" />

      <Hero />

      <ContainerLarge>
        <YStack maxW={600} mx="auto" gap="$10">
          <YStack gap="$5">
            <H2 size="$6" fontFamily="$mono">
              Private beta
            </H2>
            <Paragraph size="$8" color="$color9">
              We're looking for teams to help us shape the development of start.chat.
              We've already spent a lot of time building a best-in-class platform for team
              chat - it's fast, beautiful, and suprisingly capable for an early beta.
            </Paragraph>

            <Paragraph size="$8" color="$color9">
              We have <em>tons</em> of interesting features in development, but we need
              real user feedback to drive them.
            </Paragraph>

            <Paragraph size="$8" color="$color9">
              In exchange for your time, we'll build you the team collaboration platform
              of your dreams.
            </Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$5">
            <H3 fontFamily="$mono" size="$6">
              What we've built
            </H3>
            <Paragraph size="$8" color="$color9">
              We're unifying team chat, third party integrations, and smart agents into a
              chat app. Built on a tech foundation that's unparalleled and lets us move
              much faster than anyone else.
            </Paragraph>

            <Paragraph size="$8" color="$color9">
              We've baked in thoughtful AI, app generation, RAG, data unification, and
              more - ready to be molded to your needs.
            </Paragraph>

            <Paragraph size="$8" color="$color9">
              We're also nearly ready with next steps: generated apps and flows directly
              in your chat for incredible internal tools.
            </Paragraph>
          </YStack>

          <Separator />

          <H3 fontFamily="$mono" size="$6">
            About you
          </H3>

          <YStack gap="$5" px="$4">
            <LabeledGroup label="Name">
              <Input flex={1} />
            </LabeledGroup>

            <LabeledGroup label="Email">
              <Input flex={1} />
            </LabeledGroup>

            <LabeledGroup label="Company">
              <Input flex={1} />
            </LabeledGroup>

            <LabeledGroup label="Team size">
              <Select items={[{ id: '1-5', name: '1-5' }]} />
            </LabeledGroup>

            <LabeledGroup label="Use case">
              <TextArea rows={6} flex={1} />
            </LabeledGroup>

            <ButtonSimple theme="accent" ml="auto" mr="$4" size="large">
              Submit
            </ButtonSimple>
          </YStack>

          <Spacer size="$12" />
          <Spacer size="$12" />
        </YStack>
      </ContainerLarge>
    </>
  )
}
