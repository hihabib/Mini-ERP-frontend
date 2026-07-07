const required = (key: string): string => {
  const value = import.meta.env[key] as string | undefined
  if (!value) {
    const msg = `[env] Missing required environment variable: ${key}`
    console.error(msg)
    throw new Error(msg)
  }
  return value
}

export const env = {
  apiBaseUrl: required('VITE_API_BASE_URL'),
  socketUrl: required('VITE_SOCKET_URL'),
} as const

export type Env = typeof env
