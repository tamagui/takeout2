import { sendEmail } from '../sendEmail'

export function sendNewMessageEmail(
  email: string,
  args: {
    senderName: string
    messageContent: string
    channelName: string
    serverName: string
    messageUrl: string
  }
) {
  return sendEmail({
    to: email,
    template: 'new-message',
    variables: {
      senderName: args.senderName,
      messageContent: args.messageContent,
      channelName: args.channelName,
      serverName: args.serverName,
      messageUrl: args.messageUrl,
    },
  })
}
