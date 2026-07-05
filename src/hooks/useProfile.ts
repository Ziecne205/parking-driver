import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store'
import type { User } from '@/types/model'
import { mapProfile, type BeProfile } from '@/lib/beMappers'
import { queryKeys } from '@/lib/constants'
import type { AccountFormFields } from '@/components/driver/profile/types'

// BE: GET/PUT /driver/profile — server resolves the user from the JWT, so `userId` is only
// used to scope the query key. We also mirror changes into the auth store so the header
// avatar/name stay in sync without a reload.

const FALLBACK: User = { id: '', email: '', fullName: '' }

export function useProfile(userId: string) {
  const { data, isLoading } = useQuery<User>({
    queryKey: queryKeys.profile(userId),
    queryFn: async () => mapProfile(await api.get<BeProfile>('/driver/profile')),
    enabled: !!userId,
  })
  return { data: data ?? FALLBACK, isLoading }
}

export function useUpdateProfile(userId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: async (data: AccountFormFields) =>
      mapProfile(
        await api.put<BeProfile>('/driver/profile', {
          fullName: data.fullName,
          phoneNumber: data.phone,
          email: data.email,
        }),
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.profile(userId), updated)
      if (user) setUser({ ...user, fullName: updated.fullName, phone: updated.phone, email: updated.email })
      toast.success('Đã lưu thông tin')
    },
    onError: () => toast.error('Lưu thất bại'),
  })
}
