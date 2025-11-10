import { ArrowUp, Rocket, Sparkles } from '@tamagui/lucide-icons'
import { useRouter } from 'one'
import { Onboarding, type OnboardingStepInfo } from './Onboarding'
import { StepContent } from './OnboardingStepContent'

const steps: OnboardingStepInfo[] = [
  {
    theme: 'orange',
    Content: () => (
      <StepContent
        title="Kickstart"
        icon={Sparkles}
        description="Auth, profile, settings, adaptive layouts and many more ready for you to build on top of"
      />
    ),
  },
  {
    theme: 'green',
    Content: () => (
      <StepContent
        title="Updates"
        icon={ArrowUp}
        description="As we make the starter better, we'll keep sending PRs with our GitHub app so your app keeps improving"
      />
    ),
  },
  {
    theme: 'blue',
    Content: () => (
      <StepContent
        title="Deploy"
        icon={Rocket}
        description="The Takeout starter is the best way to go from zero to deploy and target all platforms at the same time."
      />
    ),
  },
]

/**
 * note: this screen is used as a standalone page on native and as a sidebar on auth layout on web
 */
export const OnboardingScreen = () => {
  const router = useRouter()
  return (
    <Onboarding
      autoSwipe
      onOnboarded={() => router.push('/signup/email')}
      steps={steps}
    />
  )
}
