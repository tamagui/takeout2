/**
 * Auto-completion setup for takeout/tko CLI
 */

import { defineCommand } from 'citty'
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  appendFileSync,
  readFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { spawn } from 'node:child_process'
import pc from 'picocolors'

const COMPLETION_SCRIPT = `
# Takeout/TKO CLI completion script

_takeout_completions() {
  local cur=\${COMP_WORDS[COMP_CWORD]}
  local prev=\${COMP_WORDS[COMP_CWORD-1]}

  # main commands
  local commands="script check docs onboard run update-docs update-scripts"

  # script categories
  local categories="ci aws build db dev hot-update migrate sst tauri zero"

  case "$prev" in
    takeout|tko)
      COMPREPLY=($(compgen -W "$commands" -- "$cur"))
      ;;
    script)
      COMPREPLY=($(compgen -W "$categories new" -- "$cur"))
      ;;
    ci|aws|build|db|dev|hot-update|migrate|sst|tauri|zero)
      # dynamically list scripts in category
      local scripts_dir="$PWD/scripts/$prev"
      if [ -d "$scripts_dir" ]; then
        local scripts=$(ls "$scripts_dir" 2>/dev/null | sed 's/\\.ts$//' | sed 's/\\.js$//')
        COMPREPLY=($(compgen -W "$scripts" -- "$cur"))
      fi
      ;;
  esac
}

_tko_completions() {
  local cur=\${COMP_WORDS[COMP_CWORD]}
  local prev=\${COMP_WORDS[COMP_CWORD-1]}

  # in tko mode, categories are top-level
  local commands="ci aws build db dev hot-update migrate sst tauri zero check docs onboard run script"

  case "$prev" in
    tko)
      COMPREPLY=($(compgen -W "$commands" -- "$cur"))
      ;;
    ci|aws|build|db|dev|hot-update|migrate|sst|tauri|zero)
      # dynamically list scripts in category
      local scripts_dir="$PWD/scripts/$prev"
      if [ -d "$scripts_dir" ]; then
        local scripts=$(ls "$scripts_dir" 2>/dev/null | sed 's/\\.ts$//' | sed 's/\\.js$//')
        COMPREPLY=($(compgen -W "$scripts" -- "$cur"))
      fi
      ;;
  esac
}

complete -F _takeout_completions takeout
complete -F _tko_completions tko
`

const ZSH_COMPLETION_SCRIPT = `
# Takeout/TKO CLI completion script for zsh

_takeout_completions() {
  local -a commands categories

  commands=(
    'script:Run or list scripts'
    'check:Check project setup'
    'docs:Browse documentation'
    'onboard:Initial project setup'
    'run:Run multiple commands'
    'update-docs:Update documentation'
    'update-scripts:Update scripts'
  )

  categories=(
    'ci:CI/CD scripts'
    'aws:AWS operations'
    'build:Build scripts'
    'db:Database operations'
    'dev:Development utilities'
    'hot-update:Hot update deployments'
    'migrate:Migration utilities'
    'sst:SST operations'
    'tauri:Tauri operations'
    'zero:Zero sync operations'
  )

  case $words[2] in
    script)
      if [[ $#words -eq 3 ]]; then
        _describe 'categories' categories
        _values 'commands' 'new[Create new script]'
      elif [[ $#words -eq 4 ]]; then
        # list scripts in category
        local category=$words[3]
        local scripts_dir="$PWD/scripts/$category"
        if [[ -d $scripts_dir ]]; then
          local -a scripts
          scripts=($(ls $scripts_dir 2>/dev/null | sed 's/\\.ts$//' | sed 's/\\.js$//'))
          _values 'scripts' $scripts
        fi
      fi
      ;;
    *)
      _describe 'commands' commands
      ;;
  esac
}

_tko_completions() {
  local -a commands

  commands=(
    'ci:CI/CD scripts'
    'aws:AWS operations'
    'build:Build scripts'
    'db:Database operations'
    'dev:Development utilities'
    'hot-update:Hot update deployments'
    'migrate:Migration utilities'
    'sst:SST operations'
    'tauri:Tauri operations'
    'zero:Zero sync operations'
    'check:Check project setup'
    'docs:Browse documentation'
    'onboard:Initial project setup'
    'run:Run multiple commands'
    'script:Script management'
  )

  if [[ $#words -eq 2 ]]; then
    _describe 'commands' commands
  elif [[ $#words -eq 3 ]]; then
    # list scripts in category
    local category=$words[2]
    local scripts_dir="$PWD/scripts/$category"
    if [[ -d $scripts_dir ]]; then
      local -a scripts
      scripts=($(ls $scripts_dir 2>/dev/null | sed 's/\\.ts$//' | sed 's/\\.js$//'))
      _values 'scripts' $scripts
    fi
  fi
}

compdef _takeout_completions takeout
compdef _tko_completions tko
`

function detectShell(): 'bash' | 'zsh' | 'unknown' {
  const shell = process.env.SHELL || ''
  if (shell.includes('zsh')) return 'zsh'
  if (shell.includes('bash')) return 'bash'
  return 'unknown'
}

function getShellConfigFile(shell: 'bash' | 'zsh'): string {
  const home = homedir()

  if (shell === 'zsh') {
    // check for .zshrc
    const zshrc = join(home, '.zshrc')
    if (existsSync(zshrc)) return zshrc

    // fallback to .zprofile
    const zprofile = join(home, '.zprofile')
    return zprofile
  }

  // bash
  const bashrc = join(home, '.bashrc')
  if (existsSync(bashrc)) return bashrc

  // on macOS, .bash_profile is often used
  const bashProfile = join(home, '.bash_profile')
  if (existsSync(bashProfile)) return bashProfile

  // fallback
  return bashrc
}

export const completionCommand = defineCommand({
  meta: {
    name: 'completion',
    description: 'Install shell completions for takeout/tko',
  },
  args: {
    shell: {
      type: 'positional',
      description: 'Shell type (bash or zsh)',
      required: false,
    },
  },
  async run({ args }) {
    const detectedShell = (args.shell as 'bash' | 'zsh') || detectShell()

    if (!args.shell && detectShell() === 'unknown') {
      console.error(pc.red('Could not detect shell type'))
      console.info()
      console.info('Please specify shell type:')
      console.info(`  ${pc.cyan('takeout completion bash')}`)
      console.info(`  ${pc.cyan('takeout completion zsh')}`)
      process.exit(1)
    }

    console.info(pc.cyan(`Installing completions for ${detectedShell}...`))

    const completionDir = join(homedir(), '.takeout', 'completions')
    if (!existsSync(completionDir)) {
      mkdirSync(completionDir, { recursive: true })
    }

    const scriptFile = join(completionDir, `takeout.${detectedShell}`)
    const script = detectedShell === 'zsh' ? ZSH_COMPLETION_SCRIPT : COMPLETION_SCRIPT

    // write completion script
    writeFileSync(scriptFile, script)

    // add to shell config
    const configFile = getShellConfigFile(detectedShell as 'bash' | 'zsh')
    const sourceLine = `\n# Takeout CLI completions\nsource ${scriptFile}\n`

    // check if already added
    if (existsSync(configFile)) {
      const content = readFileSync(configFile, 'utf-8')
      if (content.includes(scriptFile)) {
        console.info(pc.yellow('Completions already installed'))
        console.info()
        console.info(pc.dim(`Reload your shell or run: source ${configFile}`))
        return
      }
    }

    // add to config file
    appendFileSync(configFile, sourceLine)

    console.info(pc.green(`✓ Installed completions to ${configFile}`))
    console.info()
    console.info('To activate completions, run:')
    console.info(`  ${pc.cyan(`source ${configFile}`)}`)
    console.info()
    console.info('Or restart your terminal')
    console.info()
    console.info('Now you can use TAB to autocomplete:')
    console.info(`  ${pc.cyan('takeout sc<TAB>')} → ${pc.green('takeout script')}`)
    console.info(`  ${pc.cyan('tko ci <TAB>')} → ${pc.green('tko ci test')}`)
  },
})
