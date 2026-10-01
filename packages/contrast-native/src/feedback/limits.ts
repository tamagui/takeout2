// transport limits belong to the public report contract so the app proxy and
// the receiving platform reject the same payload before either allocates an
// unbounded body.
export const MAX_FEEDBACK_REPORT_BODY_BYTES = 8 * 1024 * 1024
export const MAX_FEEDBACK_IMAGE_BYTES = 6 * 1024 * 1024
