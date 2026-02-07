import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import * as clack from '@clack/prompts'
import pc from 'picocolors'

import { copyEnvFile, envFileExists, readEnvVariable, updateEnvVariable } from './env'
import { envCategories } from './env-categories'

import type { EnvCategory, EnvVariable } from '../types'

interface SetupOptions {
  skipOptional?: boolean
  envFile?: string
  onlyCategory?: string
  interactive?: boolean
}

export async function setupProductionEnv(
  cwd: string,
  options: SetupOptions = {}
): Promise<boolean> {
  const envFile = options.envFile || '.env.production'
  const fullPath = resolve(cwd, envFile)

  // set up interrupt handler
  const cleanup = () => {
    console.info('\n' + pc.yellow('Setup interrupted. You can resume anytime with:'))
    console.info(pc.cyan('  bun takeout env:setup'))
    console.info(
      pc.gray('\nNote: All environment variables are optional for local development.')
    )
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  try {
    clack.intro(pc.bgCyan(pc.black(' Production Environment Setup ')))

    console.info(pc.gray('All environment variables are optional.'))
    console.info(pc.gray('You can skip any section or re-run this setup anytime.\n'))

    // check if .env.production exists, if not create from example
    if (!envFileExists(cwd, envFile)) {
      const createFile = await clack.confirm({
        message: `${envFile} doesn't exist. Create it from example?`,
        initialValue: true,
      })

      if (clack.isCancel(createFile) || !createFile) {
        clack.cancel('Setup cancelled')
        process.removeListener('SIGINT', cleanup)
        process.removeListener('SIGTERM', cleanup)
        return false
      }

      const exampleFile = '.env.production.example'
      if (envFileExists(cwd, exampleFile)) {
        copyEnvFile(cwd, exampleFile, envFile)
        console.info(pc.green(`✓ Created ${envFile} from example\n`))
      } else {
        // create empty file
        writeFileSync(fullPath, '# Production Environment Variables\n')
        console.info(pc.green(`✓ Created empty ${envFile}\n`))
      }
    }

    // filter categories if specific one requested
    let categoriesToSetup = options.onlyCategory
      ? envCategories.filter((cat) => cat.id === options.onlyCategory)
      : envCategories

    if (categoriesToSetup.length === 0) {
      clack.cancel(`Category "${options.onlyCategory}" not found`)
      process.removeListener('SIGINT', cleanup)
      process.removeListener('SIGTERM', cleanup)
      return false
    }

    // ask about setting up production env
    if (options.interactive !== false && !options.onlyCategory) {
      const setupProd = await clack.confirm({
        message: 'Do you want to set up production environment variables?',
        initialValue: false,
      })

      if (clack.isCancel(setupProd) || !setupProd) {
        clack.note(
          `You can set up production environment later with:\n${pc.cyan('bun takeout env:setup')}`,
          pc.yellow('Skipping production setup')
        )
        process.removeListener('SIGINT', cleanup)
        process.removeListener('SIGTERM', cleanup)
        return true
      }
    }

    // process each category
    for (const category of categoriesToSetup) {
      const shouldSetup = await setupCategory(category, envFile, cwd, options)
      if (!shouldSetup) {
        continue
      }
    }

    // summary
    const configuredVars: string[] = []
    const skippedVars: string[] = []

    for (const category of categoriesToSetup) {
      for (const variable of category.variables) {
        const value = readEnvVariable(cwd, variable.key, envFile)
        if (value && value !== '' && !value.includes('your-')) {
          configuredVars.push(variable.key)
        } else if (variable.required) {
          skippedVars.push(variable.key)
        }
      }
    }

    if (configuredVars.length > 0) {
      clack.outro(pc.green('✓ Environment setup complete!'))
      console.info(
        pc.gray(`\nConfigured ${configuredVars.length} variables in ${envFile}`)
      )

      if (skippedVars.length > 0) {
        console.info(
          pc.yellow(
            `\nNote: Some required variables were skipped. You'll need to configure these before deploying:`
          )
        )
        skippedVars.forEach((v) => console.info(pc.gray(`  - ${v}`)))
      }

      console.info(pc.cyan('\nYou can re-run this setup anytime with:'))
      console.info(pc.gray('  bun takeout env:setup'))
      console.info(pc.cyan('\nOr set up specific categories:'))
      console.info(pc.gray('  bun takeout env:setup --category aws'))
      console.info(pc.gray('  bun takeout env:setup --category apple'))
    } else {
      clack.outro(pc.yellow('No variables configured'))
      console.info(pc.gray('\nYou can re-run this setup anytime with:'))
      console.info(pc.gray('  bun takeout env:setup'))
    }

    process.removeListener('SIGINT', cleanup)
    process.removeListener('SIGTERM', cleanup)
    return true
  } catch (error) {
    process.removeListener('SIGINT', cleanup)
    process.removeListener('SIGTERM', cleanup)
    if (error instanceof Error && error.message.includes('cancelled')) {
      return false
    }
    throw error
  }
}

async function setupCategory(
  category: EnvCategory,
  envFile: string,
  cwd: string,
  options: SetupOptions
): Promise<boolean> {
  const spinner = clack.spinner()

  // build category prompt message
  let message = `Set up ${pc.bold(category.name)}?`
  if (!category.required) {
    message += pc.gray(' (optional)')
  }
  if (category.setupTime) {
    message += pc.yellow(` ${category.setupTime}`)
  }

  console.info('') // add spacing
  const setupCategory = await clack.confirm({
    message,
    initialValue: category.required,
  })

  if (clack.isCancel(setupCategory) || !setupCategory) {
    console.info(pc.gray(`  Skipping ${category.name}`))
    return false
  }

  console.info(pc.gray(`\n${category.description}\n`))

  // process each variable in the category
  for (const variable of category.variables) {
    await setupVariable(variable, envFile, cwd)
  }

  return true
}

async function setupVariable(
  variable: EnvVariable,
  envFile: string,
  cwd: string
): Promise<void> {
  // check if already configured
  const existingValue = readEnvVariable(cwd, variable.key, envFile)
  const hasValue =
    existingValue && existingValue !== '' && !existingValue.includes('your-')

  console.info('') // spacing
  console.info(pc.bold(variable.label))
  console.info(pc.gray(variable.description))

  if (hasValue) {
    const update = await clack.confirm({
      message: `${pc.green('✓')} Already configured. Update?`,
      initialValue: false,
    })

    if (clack.isCancel(update) || !update) {
      return
    }
  }

  // show instructions
  console.info('')
  console.info(pc.cyan('Instructions:'))
  variable.instructions.split('\n').forEach((line) => {
    console.info(pc.gray(`  ${line}`))
  })
  console.info('')

  // handle different input types
  let value: string | undefined

  if (variable.generator) {
    const generate = await clack.confirm({
      message: `Generate ${variable.label} automatically?`,
      initialValue: true,
    })

    if (!clack.isCancel(generate) && generate) {
      value = variable.generator()
      console.info(pc.green(`✓ Generated ${variable.label}`))
    }
  }

  if (!value) {
    if (variable.type === 'multiline') {
      console.info(pc.gray('Paste content (press Enter twice when done):'))
      value = await readMultilineInput()
    } else if (variable.type === 'secret') {
      const result = await clack.password({
        message: `Enter ${variable.label}:`,
        mask: '*',
      })
      if (!clack.isCancel(result)) {
        value = result
      }
    } else {
      const result = await clack.text({
        message: `Enter ${variable.label}:`,
        placeholder: variable.placeholder,
        defaultValue: variable.default,
        validate: (val) => {
          if (variable.required && !val) {
            return 'This field is required'
          }
          return undefined
        },
      })
      if (!clack.isCancel(result)) {
        value = result
      }
    }
  }

  if (value && !clack.isCancel(value)) {
    updateEnvVariable(cwd, variable.key, value, envFile)
    console.info(pc.green(`✓ Saved ${variable.key}`))
  } else if (variable.required) {
    console.info(pc.yellow(`⚠ Skipped required variable: ${variable.key}`))
  } else {
    console.info(pc.gray(`  Skipped ${variable.key}`))
  }
}

async function readMultilineInput(): Promise<string> {
  return new Promise((resolve) => {
    const lines: string[] = []
    let emptyLineCount = 0

    const reader = process.stdin
    reader.setEncoding('utf8')

    const onData = (chunk: string) => {
      const chunkLines = chunk.split('\n')
      for (const line of chunkLines) {
        if (line === '') {
          emptyLineCount++
          if (emptyLineCount >= 2) {
            reader.removeListener('data', onData)
            resolve(lines.join('\n'))
            return
          }
        } else {
          if (emptyLineCount === 1) {
            lines.push('') // add the single empty line
          }
          emptyLineCount = 0
          lines.push(line)
        }
      }
    }

    reader.on('data', onData)
  })
}

export function listCategories(): void {
  console.info(pc.bold('\nAvailable environment categories:\n'))

  for (const category of envCategories) {
    const status = category.required ? pc.red('required') : pc.gray('optional')
    console.info(`  ${pc.cyan(category.id.padEnd(12))} - ${category.name} ${status}`)
    console.info(`  ${pc.gray(category.description)}`)
    if (category.setupTime) {
      console.info(`  ${pc.yellow(category.setupTime)}`)
    }
    console.info('')
  }

  console.info(pc.gray('Run setup for a specific category:'))
  console.info(pc.cyan('  bun takeout env:setup --category <id>\n'))
}
