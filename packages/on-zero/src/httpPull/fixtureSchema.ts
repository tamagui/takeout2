import { createSchema, relationships, string, table } from '@rocicorp/zero'

import type { Transaction } from '@rocicorp/zero'

const user = table('user')
  .columns({
    id: string(),
    name: string(),
  })
  .primaryKey('id')

const project = table('project')
  .columns({
    id: string(),
    ownerId: string(),
    name: string(),
  })
  .primaryKey('id')

const member = table('member')
  .columns({
    id: string(),
    projectId: string(),
    userId: string(),
  })
  .primaryKey('id')

export const zeroHttpFixtureSchema = createSchema({
  tables: [user, project, member],
  relationships: [
    relationships(project, ({ many }) => ({
      members: many({
        sourceField: ['id'],
        destField: ['projectId'],
        destSchema: member,
      }),
    })),
  ],
  enableLegacyQueries: true,
})

type FixtureTransaction = Transaction<typeof zeroHttpFixtureSchema>

export type ProjectCreateArgs = {
  id: string
  ownerId: string
  name: string
}

export type ProjectRenameArgs = {
  id: string
  name: string
}

export type MemberAddArgs = {
  id: string
  projectId: string
  userId: string
}

export type MemberRemoveArgs = {
  id: string
}

export const zeroHttpFixtureMutators = {
  project: {
    create: async (tx: FixtureTransaction, args: ProjectCreateArgs) => {
      await tx.mutate.project.insert(args)
    },
    rename: async (tx: FixtureTransaction, args: ProjectRenameArgs) => {
      await tx.mutate.project.update(args)
    },
  },
  member: {
    add: async (tx: FixtureTransaction, args: MemberAddArgs) => {
      await tx.mutate.member.insert(args)
    },
    remove: async (tx: FixtureTransaction, args: MemberRemoveArgs) => {
      await tx.mutate.member.delete({ id: args.id })
    },
  },
}
