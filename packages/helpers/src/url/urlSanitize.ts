/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const protocols = new Set(['http:', 'https:', 'mailto:', 'tel:', 'sms:'])

export function urlSanitize(url: string): string {
  try {
    const parsedUrl = new URL(url)
    if (!protocols.has(parsedUrl.protocol)) {
      return 'about:blank'
    }
  } catch {
    return url
  }
  return url
}
