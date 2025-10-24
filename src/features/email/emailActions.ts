import { sendInviteEmail } from './actions/sendInviteEmail'
import { sendMagicLinkEmail } from './actions/sendMagicLinkEmail'
import { sendNewMessageEmail } from './actions/sendNewMessageEmail'
import { sendPrivateBetaInvite } from './actions/sendPrivateBetaInvite'
import { sendWelcomeEmail } from './actions/sendWelcomeEmail'

export const emailActions = {
  sendNewMessageEmail,
  sendWelcomeEmail,
  sendMagicLinkEmail,
  sendInviteEmail,
  sendPrivateBetaInvite,
}

export type EmailActions = typeof emailActions
