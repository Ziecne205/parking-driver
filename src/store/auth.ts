import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/model'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { setToken, setUnauthorizedHandler } from '@/lib/authToken'
import { getQueryClient } from '@/lib/queryClient'
import { mapProfile, type BeProfile } from '@/lib/beMappers'

/** BE `LoginResponse` (AuthController) — the only fields login/register return. */
interface LoginResponse {
  token: string
  username: string
  roleName: string
}

function errMessage(error: unknown, fallback: string): string {
  return (error as { message?: string })?.message || fallback
}

/** Fields collected by the driver register form (step 1) and reused when verifying (step 2). */
interface RegisterOtpFields {
  fullName: string
  phone: string
  email: string
  password: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  /** True once Zustand persist has rehydrated from localStorage.
   *  Protected pages must wait for this before making any redirect decision. */
  _hasHydrated: boolean
  _setHasHydrated: (value: boolean) => void
  login: (username: string, password: string) => Promise<void>
  /** Register step 1: send an OTP to the email. Returns the masked email (e.g. n***@gmail.com). */
  registerSendOtp: (fields: RegisterOtpFields) => Promise<string>
  /** Register step 2: verify the OTP, create the account, and log in. */
  registerVerify: (fields: RegisterOtpFields, otp: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      _setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),

      login: async (username: string, password: string) => {
        set({ isLoading: true })
        try {
          const res = await api.post<LoginResponse>('/auth/login', { username, password })
          // BẢO MẬT: app tài xế CHỈ dành cho tài khoản Driver. Từ chối tài khoản nội bộ
          // (Staff/Manager/Admin) — họ phải dùng cổng quản trị (parking-fe). Không lưu token.
          if ((res.roleName ?? '').toUpperCase() !== 'DRIVER') {
            throw new Error('Tài khoản này không phải tài khoản tài xế. Vui lòng dùng cổng quản trị.')
          }
          setToken(res.token)
          // Seed the user with the username; real fullName is filled in below
          // by fetching /driver/profile so the home page greets with the correct name.
          const loggedUser: User = {
            id: res.username,
            email: '',
            fullName: res.username,
            status: 'Active',
          }
          set({ user: loggedUser, isAuthenticated: true, isLoading: false })
          toast.success('Đăng nhập thành công')

          // FE-9: fetch real profile in the background and sync into store
          try {
            const profile = await api.get<BeProfile>('/driver/profile')
            const mapped = mapProfile(profile)
            set((s) => ({
              user: s.user ? { ...s.user, fullName: mapped.fullName, email: mapped.email, phone: mapped.phone } : s.user,
            }))
          } catch {
            // Non-critical — the app still works with the username as fallback
          }
        } catch (error) {
          set({ isLoading: false })
          toast.error(errMessage(error, 'Đăng nhập thất bại'))
          throw error
        }
      },

      registerSendOtp: async (fields) => {
        set({ isLoading: true })
        try {
          // BE trả về email đã che (vd "ngu***@gmail.com") trong `data`. Username = email.
          const masked = await api.post<string>('/auth/register/send-otp', {
            username: fields.email,
            password: fields.password,
            fullName: fields.fullName,
            phoneNumber: fields.phone,
            email: fields.email,
          })
          set({ isLoading: false })
          return masked
        } catch (error) {
          set({ isLoading: false })
          toast.error(errMessage(error, 'Không gửi được mã OTP'))
          throw error
        }
      },

      registerVerify: async (fields, otp) => {
        set({ isLoading: true })
        try {
          const res = await api.post<LoginResponse>('/auth/register/verify', {
            email: fields.email,
            otp,
          })
          setToken(res.token)
          const registeredUser: User = {
            id: res.username,
            email: fields.email,
            phone: fields.phone,
            fullName: fields.fullName,
            status: 'Active',
          }
          set({ user: registeredUser, isAuthenticated: true, isLoading: false })
          toast.success('Đăng ký thành công')
        } catch (error) {
          set({ isLoading: false })
          toast.error(errMessage(error, 'Xác thực OTP thất bại'))
          throw error
        }
      },

      logout: () => {
        setToken(null)
        // FE-8: clear all cached query data so the next user doesn't see stale data
        getQueryClient().clear()
        set({ user: null, isAuthenticated: false })
        toast.success('Đăng xuất thành công')
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      },
    }),
    {
      // Driver-app-specific key so it doesn't share state with the parking-fe console
      // when both run on the same localhost origin.
      name: 'driver-auth-storage',
      onRehydrateStorage: () => (state) => {
        // FE-2: mark hydration complete so protected pages can safely redirect
        state?._setHasHydrated(true)
      },
    }
  )
)

// A rejected JWT (401, detected in lib/api) resets auth state here so protected pages
// route back to login instead of looping on failed requests. The token itself was
// already cleared by notifyUnauthorized(); we only reset store + cache once.
setUnauthorizedHandler(() => {
  if (!useAuthStore.getState().isAuthenticated) return
  getQueryClient().clear()
  useAuthStore.setState({ user: null, isAuthenticated: false })
  toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại')
})
