// web stub
export const registerDevice = async (_userId: string) => ({
  success: false,
  error: 'unsupported-device',
})

export const disableDevicePush = async (_userId: string, _platform: 'ios' | 'android') => {}
