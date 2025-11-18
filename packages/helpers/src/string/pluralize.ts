let pluralRules = new Intl.PluralRules('en-US')

export function pluralize(count: number, singular: string, plural: string): string {
  const grammaticalNumber = pluralRules.select(count)
  switch (grammaticalNumber) {
    case 'one':
      return `${count} ${singular}`
    case 'other':
      return `${count} ${plural}`
    default:
      throw new Error(
        `Can't pluralize: ${grammaticalNumber} for ${count} / ${singular} / ${plural}`
      )
  }
}

export function setPluralizeLocale(locale: Intl.LocalesArgument): void {
  pluralRules = new Intl.PluralRules(locale)
}

export type PluralizeFn = typeof pluralize
