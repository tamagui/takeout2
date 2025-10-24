// this is what runs on the server/client

import type { AppDefinition } from 'start/app'

export function createApp(definition: AppDefinition<any, any>) {
  console.warn(`called create!`, definition)
}
