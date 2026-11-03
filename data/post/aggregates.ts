import { count, type AggregateDefinitions } from 'limesync/aggregate'
import { schema } from '~/data/generated/schema'

export const aggregates = {
  postCommentCount: {
    source: 'comment',
    target: 'post',
    mode: 'existing',
    groupBy: {
      postId: 'id',
    },
    columns: {
      commentCount: count(),
    },
  },
} satisfies AggregateDefinitions<typeof schema>
