#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Add a Phosphor icon to the project`.run(async ({ fs, path }) => {
  const PHOSPHOR_BASE =
    'https://raw.githubusercontent.com/phosphor-icons/core/main/assets'

  type Weight = 'regular' | 'bold' | 'duotone' | 'fill' | 'light' | 'thin'

  interface IconData {
    name: string
    weight: Weight
    svg: string
  }

  async function fetchPhosphorIcon(
    name: string,
    weight: Weight = 'regular'
  ): Promise<string> {
    // convert PascalCase to kebab-case
    const kebabName = name
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
    // phosphor file naming: regular has no suffix, others have weight suffix
    const filename =
      weight === 'regular' ? `${kebabName}.svg` : `${kebabName}-${weight}.svg`
    const url = `${PHOSPHOR_BASE}/${weight}/${filename}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch icon: ${url} (${response.status})`)
    }

    return await response.text()
  }

  function extractPathData(svg: string): string[] {
    const pathRegex =
      /<path[^>]*d="([^"]+)"[^>]*\/?>|<(?:rect|circle|line|polyline|polygon|ellipse)[^>]*\/?>|<(?:rect|circle|line|polyline|polygon|ellipse)[^>]*>.*?<\/(?:rect|circle|line|polyline|polygon|ellipse)>/g
    const paths: string[] = []

    let match
    while ((match = pathRegex.exec(svg)) !== null) {
      const fullMatch = match[0]

      // handle path elements
      if (fullMatch.startsWith('<path')) {
        const dMatch = /d="([^"]+)"/.exec(fullMatch)
        const fillMatch = /fill="([^"]+)"/.exec(fullMatch)
        const opacityMatch = /opacity="([^"]+)"/.exec(fullMatch)

        if (dMatch) {
          let pathElement = `<Path d="${dMatch[1]}"`

          if (fillMatch && fillMatch[1] !== 'currentColor') {
            pathElement += ` fill="${fillMatch[1]}"`
          } else {
            pathElement += ' fill={fill}'
          }

          if (opacityMatch) {
            pathElement += ` opacity="${opacityMatch[1]}"`
          }

          pathElement += ' />'
          paths.push(pathElement)
        }
      }
      // handle other svg elements
      else {
        // convert svg primitives to Path if needed, or pass through as-is
        const element = fullMatch
          .replace(/fill="currentColor"/g, 'fill={fill}')
          .replace(/<(rect|circle|line|polyline|polygon|ellipse)/g, '<$1')

        paths.push(element)
      }
    }

    return paths
  }

  function generateIconComponent(iconData: IconData): string {
    const { name, svg } = iconData
    const pascalName = name.charAt(0).toUpperCase() + name.slice(1)
    const componentName = `${pascalName}Icon`

    const paths = extractPathData(svg)

    if (paths.length === 0) {
      throw new Error(`No path data found in SVG for ${name}`)
    }

    const pathsCode = paths.map((path) => `      ${path}`).join('\n')

    return `import Svg, { Path } from 'react-native-svg'
import { useIconProps } from '~/interface/icons/useIconProps'
import type { IconProps } from '~/interface/icons/types'

export const ${componentName} = (props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
${pathsCode}
    </Svg>
  )
}
`
  }

  async function addPhosphorIcon(name: string, weight: Weight = 'regular') {
    console.info(`Fetching ${name} icon (${weight})...`)

    try {
      const svg = await fetchPhosphorIcon(name, weight)
      const iconData: IconData = { name, weight, svg }
      const componentCode = generateIconComponent(iconData)

      const iconsDir = path.join(process.cwd(), 'src/interface/icons/phosphor')
      await fs.promises.mkdir(iconsDir, { recursive: true })

      const pascalName = name.charAt(0).toUpperCase() + name.slice(1)
      const filename = `${pascalName}Icon.tsx`
      const filepath = path.join(iconsDir, filename)

      await fs.promises.writeFile(filepath, componentCode, 'utf-8')

      console.info(`✓ Created ${filename}`)
      console.info(
        `  Import: import { ${pascalName}Icon } from '~/interface/icons/phosphor/${pascalName}Icon'`
      )
    } catch (error) {
      console.error(
        `✗ Failed to add icon: ${error instanceof Error ? error.message : String(error)}`
      )
      process.exit(1)
    }
  }

  // parse CLI arguments
  const cliArgs = process.argv.slice(2)
  if (cliArgs.length === 0) {
    console.error(
      'Usage: bun tko icon add-phosphor <IconName> [--weight=regular|bold|duotone|fill|light|thin]'
    )
    console.error('')
    console.error('Examples:')
    console.error('  bun tko icon add-phosphor Heart')
    console.error('  bun tko icon add-phosphor User --weight=fill')
    process.exit(1)
  }

  const iconName = cliArgs[0]
  if (!iconName) {
    console.error('Error: Icon name is required')
    process.exit(1)
  }

  const weightArg = cliArgs.find((arg) => arg.startsWith('--weight='))
  const weight = (weightArg?.split('=')[1] || 'regular') as Weight

  await addPhosphorIcon(iconName, weight)
})
