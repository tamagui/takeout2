// the calendar-day field, one entry point, two legs chosen by platform
// extension.
//
// `./DateFieldImpl` resolves to DateFieldImpl.ios.tsx on ios and
// DateFieldImpl.tsx everywhere else, for the reason forms/Form.tsx gives:
// the exports map never names a file with a `.ios` or `.android` sibling,
// because the exports target resolves exactly and every device would read
// one leg.
export * from './DateFieldImpl'
export type { DateFieldProps } from './formContract'
