export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .replace(/[\s_]+/g, '-') // convert spaces and underscores to dashes
    .replace(/[^a-z0-9-]/g, '') // remove all non-alphanumeric except dashes
    .replace(/-+/g, '-') // replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // remove leading/trailing dashes
