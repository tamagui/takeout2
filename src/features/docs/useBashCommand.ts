import { type ReactNode, isValidElement } from 'react'

import { useLocalStorageWatcher } from './useLocalStorageWatcher'

export const PACKAGE_MANAGERS = ['bun', 'npm', 'yarn', 'pnpm'] as const

const EXEC_COMMANDS: Record<string, string> = {
  npm: 'npx',
  yarn: 'yarn dlx',
  bun: 'bunx',
  pnpm: 'pnpm dlx',
}

const INSTALL_COMMANDS: Record<string, string> = {
  npm: 'install',
  yarn: 'add',
  bun: 'add',
  pnpm: 'install',
}

const CREATE_COMMANDS: Record<string, string> = {
  npm: 'create',
  yarn: 'create',
  bun: 'create',
  pnpm: 'create',
}

const SCRIPT_COMMANDS: Record<string, string> = {
  npm: 'run',
  yarn: '',
  bun: 'run',
  pnpm: '',
}

const parseCommand = (text: string) => {
  const words = text.trim().split(' ')
  let packageManager = ''
  let command = ''
  let args = ''

  for (const [pm, execCmd] of Object.entries(EXEC_COMMANDS)) {
    const execCmdParts = execCmd.split(' ')
    if (
      words[0] === execCmdParts[0] &&
      (execCmdParts.length === 1 ||
        words.slice(0, execCmdParts.length).join(' ') === execCmd)
    ) {
      packageManager = pm
      command = execCmd
      args = words.slice(execCmdParts.length).join(' ')
      return { packageManager, command, args }
    }
  }

  packageManager = words[0] || ''
  command = words[1] || ''
  args = words.slice(2).join(' ')

  if (command === 'install' && args === '') {
    return { packageManager, command: 'install', args: '' }
  }

  return { packageManager, command, args }
}

export const stringIsScriptCommand = (text: string) => {
  const { packageManager, command } = parseCommand(text)
  if (!PACKAGE_MANAGERS.includes(packageManager as (typeof PACKAGE_MANAGERS)[number]))
    return false

  const scriptCmd = SCRIPT_COMMANDS[packageManager]
  if (scriptCmd === '') {
    return (
      command !== 'add' &&
      command !== 'install' &&
      command !== 'create' &&
      !stringIsExecCommand(text)
    )
  }
  return command === 'run'
}

const isPackageManagerCommand = (text: string) => {
  const { packageManager, command } = parseCommand(text)
  return (
    PACKAGE_MANAGERS.includes(packageManager as (typeof PACKAGE_MANAGERS)[number]) &&
    (Object.values(INSTALL_COMMANDS).includes(command) ||
      Object.values(CREATE_COMMANDS).includes(command) ||
      Object.values(EXEC_COMMANDS).includes(command) ||
      stringIsExecCommand(text) ||
      stringIsScriptCommand(text))
  )
}

const stringIsInstallCommand = (text: string) => {
  const { packageManager, command } = parseCommand(text)
  return (
    PACKAGE_MANAGERS.includes(packageManager as (typeof PACKAGE_MANAGERS)[number]) &&
    Object.values(INSTALL_COMMANDS).includes(command)
  )
}

export const stringIsExecCommand = (text: string) => {
  return PACKAGE_MANAGERS.some((pm) => {
    const execCmd = EXEC_COMMANDS[pm]
    if (!execCmd) return false
    const execCmdParts = execCmd.split(' ')
    return (
      text.trim().startsWith(execCmdParts[0] || '') &&
      (execCmdParts.length === 1 || text.trim().startsWith(execCmd))
    )
  })
}

export const stringIsCreateCommand = (text: string) => {
  const { packageManager, command } = parseCommand(text)
  return (
    PACKAGE_MANAGERS.includes(packageManager as (typeof PACKAGE_MANAGERS)[number]) &&
    Object.values(CREATE_COMMANDS).includes(command) &&
    !stringIsExecCommand(text)
  )
}

function getBashText(children: ReactNode): string {
  const extractText = (node: ReactNode): string => {
    if (typeof node === 'string') return node
    if (Array.isArray(node)) return node.map(extractText).join('')
    if (isValidElement(node)) {
      const props = node.props as { children?: ReactNode }
      return extractText(props.children)
    }
    return ''
  }
  return extractText(children)
}

type UseBashCommandOutputs = {
  isTerminalCommand: boolean
  isCreateCommand: boolean
  isInstallCommand: boolean
  isExecCommand: boolean
  isScriptCommand: boolean
  showTabs: boolean
  commandType: string
  transformedCommand: string
  selectedPackageManager: (typeof PACKAGE_MANAGERS)[number]
  originalPackageManager: string
  setPackageManager: (value: string) => void
}

export function useBashCommand(
  node: ReactNode,
  className: string = 'language-bash'
): UseBashCommandOutputs {
  const bashText = getBashText(node).trim()
  const isBash = className === 'language-bash'

  const isPackageCommand = isBash && isPackageManagerCommand(bashText)

  const { packageManager: originalPackageManager } = parseCommand(bashText)

  const isInstallCommand = isPackageCommand && stringIsInstallCommand(bashText)
  const isExecCommand = isPackageCommand && stringIsExecCommand(bashText)
  const isCreateCommand = isPackageCommand && stringIsCreateCommand(bashText)
  const isScriptCommand = isPackageCommand && stringIsScriptCommand(bashText)
  const isTerminalCommand = isBash && !isPackageCommand

  const showTabs = isBash && !isTerminalCommand

  const defaultTab = 'bun'
  const { storageItem: selectedPackageManager, setItem: setPackageManager } =
    useLocalStorageWatcher('bashRunTab', defaultTab)

  const transformCommand = (inputCommand: string): string => {
    if (!isBash) return inputCommand.trim()
    if (isTerminalCommand) return inputCommand.trim()

    const commands = inputCommand.split('&&').map((cmd) => cmd.trim())
    const transformedCommands = commands.map((cmd) => {
      const { args } = parseCommand(cmd)

      if (stringIsInstallCommand(cmd)) {
        if (args === '') {
          return `${selectedPackageManager} install`.trim()
        }
        const installCmd = INSTALL_COMMANDS[selectedPackageManager]
        return `${selectedPackageManager} ${installCmd} ${args}`.trim()
      }

      if (stringIsCreateCommand(cmd)) {
        const createCmd = CREATE_COMMANDS[selectedPackageManager]
        return `${selectedPackageManager} ${createCmd} ${args}`.trim()
      }

      if (stringIsExecCommand(cmd)) {
        const runCmd = EXEC_COMMANDS[selectedPackageManager]
        return `${runCmd} ${args}`.trim()
      }

      if (stringIsScriptCommand(cmd)) {
        const scriptCmd = SCRIPT_COMMANDS[selectedPackageManager]
        const { command } = parseCommand(cmd)
        const scriptName = args || command
        return `${selectedPackageManager}${scriptCmd ? ' ' + scriptCmd : ''} ${scriptName}`.trim()
      }

      return cmd
    })

    return transformedCommands.join(' && ')
  }

  const transformedCommand = transformCommand(bashText)

  return {
    isTerminalCommand,
    isCreateCommand,
    isInstallCommand,
    isExecCommand,
    isScriptCommand,
    showTabs,
    commandType: parseCommand(bashText).command,
    transformedCommand,
    originalPackageManager,
    selectedPackageManager: selectedPackageManager as (typeof PACKAGE_MANAGERS)[number],
    setPackageManager,
  }
}
