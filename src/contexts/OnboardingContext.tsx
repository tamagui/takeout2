import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type SignupMethod = 'phone' | 'email' | 'social'

interface OnboardingContextType {
  signupMethod: SignupMethod | null
  setSignupMethod: (method: SignupMethod) => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [signupMethod, setSignupMethod] = useState<SignupMethod | null>(null)

  return (
    <OnboardingContext.Provider
      value={useMemo(() => ({ signupMethod, setSignupMethod }), [signupMethod])}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
