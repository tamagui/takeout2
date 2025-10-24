/**
 * changes from v4:
 *  - more small breakpoints because container queries want them
 *  - as breakpoints get smaller they get closer together
 *
 * rationale:
 *
 *  - we generally have more need for breakpoints on smaller screens
 *  - container queries mean even smaller parents sizes to size against
 *  - give more granularity for those small sizes
 */

export const breakpoints = {
  xxl: 1240,
  xl: 1024,
  lg: 800,
  md: 600,
  sm: 500,
  xs: 440,
  xxs: 380,
  xxxs: 260,
}
