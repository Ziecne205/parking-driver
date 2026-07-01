import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/model'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { setToken } from '@/lib/authToken'
import { getQueryClient } from '@/lib/queryClient'
import { mapProfile, type BeProfile } from '@/lib/beMappers'

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
  /** True once Zustand persist has rehydrated from localStorage.
   *  Protected pages must wait for this before making any redirect decision. */
  _hasHydrated: boolean
  _setHasHydrated: (value: boolean) => void
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

      register: async (fields) => {
        set({ isLoading: true })
        try {
          // BE RegisterRequest: { username, password, fullName, phoneNumber, email }.
          // Using email as username (Driver form has no separate username field).
          const res = await api.post<LoginResponse>('/auth/register', {
            username: fields.email,
            password: fields.password,
            fullName: fields.fullName,
            phoneNumber: fields.phone,
            email: fields.email,
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
