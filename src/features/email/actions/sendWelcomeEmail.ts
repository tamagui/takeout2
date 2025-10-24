import { sendEmail } from '../sendEmail'

export function sendWelcomeEmail(email: string, userName: string) {
  return sendEmail({
    to: email,
    template: 'welcome',
    variables: {
      userName,
    },
  })
}
