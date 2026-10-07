import '@tamagui/native/setup-gesture-handler'
import '@tamagui/native/setup-keyboard-controller'
import '@tamagui/native/setup-teleport'
import '@tamagui/native/setup-safe-area'
import 'one'
import { registerNativeMenuAdapter } from '@tamagui/native'
import { createOneMenuAdapter } from './menu/oneMenuAdapter'

registerNativeMenuAdapter(createOneMenuAdapter())
