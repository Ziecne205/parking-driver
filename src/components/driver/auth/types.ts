export interface DriverLoginFields {
  email: string
  password: string
  remember?: boolean
}

export interface DriverRegisterFields {
  fullName: string
  phone: string
  email: string
  password: string
  licensePlate?: string
}

export interface DriverLoginProps {
  readonly onSwitchToRegister: () => void
}

export interface DriverRegisterProps {
  readonly onSwitchToLogin: () => void
}
