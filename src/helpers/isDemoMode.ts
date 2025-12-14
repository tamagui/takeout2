// helper to check if demo mode is enabled - checks at build time via Vite's env
// this centralizes the check to avoid inconsistent bundling across pages
export const isDemoMode = import.meta.env.DEV || !!import.meta.env.VITE_DEMO_MODE
