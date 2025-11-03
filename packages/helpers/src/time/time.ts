interface MsFunction {
  (n: number): number
  seconds: (n: number) => number
  minutes: (n: number) => number
  hours: (n: number) => number
  days: (n: number) => number
  weeks: (n: number) => number
}

interface SecondFunction {
  (n: number): number
  minutes: (n: number) => number
  hours: (n: number) => number
  days: (n: number) => number
  weeks: (n: number) => number
}

interface MinuteFunction {
  (n: number): number
  hours: (n: number) => number
  days: (n: number) => number
  weeks: (n: number) => number
}

const ms = ((n: number) => n) as MsFunction
ms.seconds = (n: number) => n * 1000
ms.minutes = (n: number) => ms.seconds(n * 60)
ms.hours = (n: number) => ms.minutes(n * 60)
ms.days = (n: number) => ms.hours(n * 24)
ms.weeks = (n: number) => ms.days(n * 7)

const second = ((n: number) => n) as SecondFunction
second.minutes = (n: number) => n * 60
second.hours = (n: number) => second.minutes(n * 60)
second.days = (n: number) => second.hours(n * 24)
second.weeks = (n: number) => second.days(n * 7)

const minute = ((n: number) => n * 60) as MinuteFunction
minute.hours = (n: number) => minute(n * 60)
minute.days = (n: number) => minute.hours(n * 24)
minute.weeks = (n: number) => minute.days(n * 7)

export const time: {
  ms: MsFunction
  second: SecondFunction
  minute: MinuteFunction
} = {
  ms,
  second,
  minute,
}
