import { Resource } from 'sst'

console.warn(`Resources:`, Resource)

// not working? tried lots of variations of port/url:

// console.warn(
//   `WebApp ok?`,
//   await fetch(`http://WebApp.start-dot-chat.production.sst:8081`).then((res) =>
//     res.json()
//   )
// )

// console.warn(
//   `Typsense ok?`,
//   await fetch(`http://TypeSense.production.start-dot-chat.sst:8108/health`).then((res) =>
//     res.json()
//   )
// )
