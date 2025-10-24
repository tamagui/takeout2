// TODO this isn't "right" - im just listing the origin tables
// ideally RelatedToChannel is just some sort of RelatedTo<'channel'>
// and it can work backwards from the relationships to find all models

export type RelatedToServerAndChannel =
  | 'message'
  | 'meeting'
  | 'channelTopic'
  | 'pin'
  | 'channelPermission'
  | 'channelTopicMessage'

export type RelatedToChannel = RelatedToServerAndChannel

export type RelatedToServer = 'role' | 'appInstall' | 'data' | RelatedToServerAndChannel
