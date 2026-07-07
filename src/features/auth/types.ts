export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
}

export interface RefreshResponse {
  accessToken: string
}
