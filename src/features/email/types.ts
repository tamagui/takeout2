export type EmailTemplate =
  | {
      template: 'magic-link'
      variables: {
        link: string
      }
    }
  | {
      template: 'welcome'
      variables: {
        userName: string
      }
    }
  | {
      template: 'new-message'
      variables: {
        senderName: string
        messageContent: string
        channelName: string
        serverName: string
        messageUrl: string
      }
    }
  | {
      template: 'server-invite'
      variables: {
        inviterName: string
        serverName: string
        roleName?: string
        inviteUrl: string
      }
    }

export type EmailTemplateAlias = EmailTemplate['template']

export type EmailTemplateVariables<T extends EmailTemplateAlias> = Extract<
  EmailTemplate,
  { template: T }
>['variables']

export type SendEmailParams<T extends EmailTemplateAlias> = {
  to: string
  template: T
  variables: EmailTemplateVariables<T>
  from?: string
}
