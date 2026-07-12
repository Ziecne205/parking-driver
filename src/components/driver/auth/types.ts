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
  confirmPassword: string
}

export interface DriverLoginProps {
  readonly onSwitchToRegister: () => void
  readonly onSwitchToForgot: () => void
}

export interface DriverRegisterProps {
  readonly onSwitchToLogin: () => void
}

export interface DriverForgotPasswordProps {
  readonly onSwitchToLogin: () => void
}
