import { Voltra } from 'voltra'
import { updateWidget } from 'voltra/client'

import { APP_SCHEME } from '~/features/auth/constants'

// create post widget - instagram-style quick action
function createPostWidgetUI() {
  return (
    <Voltra.Link destination={`${APP_SCHEME}://create-post`}>
      <Voltra.VStack
        style={{
          padding: 16,
          width: '100%',
          height: '100%',
          backgroundColor: '#1a1a1a',
        }}
      >
        <Voltra.HStack alignment="center">
          <Voltra.Text
            style={{
              color: '#ffffff',
              fontSize: 22,
              fontWeight: '700',
            }}
          >
            Create
          </Voltra.Text>
          <Voltra.Spacer />
        </Voltra.HStack>

        <Voltra.Spacer />

        <Voltra.VStack alignment="center" style={{ width: '100%' }}>
          <Voltra.Symbol
            name="plus.square"
            weight="medium"
            size={56}
            tintColor="#e6dac1"
          />
        </Voltra.VStack>

        <Voltra.Spacer />
      </Voltra.VStack>
    </Voltra.Link>
  )
}

export async function initCreatePostWidget() {
  try {
    await updateWidget('create_post', {
      systemSmall: createPostWidgetUI(),
    })
  } catch (e) {
    console.info('[widgets] failed to init create post widget', e)
  }
}
