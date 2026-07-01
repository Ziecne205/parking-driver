import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/model'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { setToken } from '@/lib/authToken'

/** BE `LoginResponse` (AuthController) — the only fields login/register return. */
interface LoginResponse {
  token: string
  username: string
}

function errMessage(error: unknown, fallback: string): string {
  return (error as { message?: string })?.message || fallback
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (fields: {
    fullName: string
    phone: string
    email: string
    password: string
    licensePlate?: string
  }) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true })
        try {
          const res = await api.post<LoginResponse>('/auth/login', { username, password })
          setToken(res.token)
          const loggedUser: User = {
            id: res.username,
            email: '',
            fullName: res.username, // BE login không trả fullName (Phase 4: GET /driver/profile)
            status: 'Active',
          }
          set({ user: loggedUser, isAuthenticated: true, isLoading: false })
          toast.success('Đăng nhập thành công')
        } catch (error) {
          set({ isLoading: false })
          toast.error(errMessage(error, 'Đăng nhập thất bại'))
          throw error
        }
      },

      register: async (fields) => {
        set({ isLoading: true })
        try {
          // BE RegisterRequest: { username, password, fullName, phoneNumber, email, roleName }.
          // Tạm dùng email làm username (form Driver chưa có field username riêng).
          const res = await api.post<LoginResponse>('/auth/register', {
            username: fields.email,
            password: fields.password,
            fullName: fields.fullName,
            phoneNumber: fields.phone,
            email: fields.email,
            roleName: 'Driver',
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
          toast.error(errMessage(error, 'Đăng ký thất bại'))
          throw error
        }
      },

      logout: () => {
        setToken(null)
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
    }
  )
)
