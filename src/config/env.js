// Env adapter — works in both Vite (import.meta.env) and Jest (process.env)
const isVite = typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined'

export const env = {
  VITE_API_URL: isVite ? import.meta.env.VITE_API_URL : process.env.VITE_API_URL,
}
