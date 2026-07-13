import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type AppError } from '@/lib/api'
import { queryKeys } from '@/lib/constants'

/** BE ParkingSessionDTO (GET /driver/sessions/history) — phiên đỗ của chính tài xế. */
export interface DriverSession {
  sessionId: number
  /** Set when the session came from a reservation (booked); null/absent for walk-ins. */
  reservationId?: number | null
  licensePlateIn: string
  licensePlateOut?: string | null
  vehicleTypeName?: string | null
  entryTime: string
  exitTime?: string | null
  status: string // Completed | Exception
  estimatedFee?: number | null
}

/** Lịch sử phiên đỗ (Completed/Exception) của tài xế — GET /driver/sessions/history. */
export function useSessionHistory() {
  return useQuery<DriverSession[]>({
    queryKey: queryKeys.sessionHistory,
    queryFn: () => api.get<DriverSession[]>('/driver/sessions/history'),
  })
}

export interface FeedbackInput {
  sessionId: number
  rating: number // 1–5
  comment?: string
}

/**
 * Gửi đánh giá cho một phiên đỗ ĐÃ HOÀN THÀNH của chính tài xế — POST /driver/feedbacks.
 * BE chặn: phiên phải là của mình, đã Completed, và chưa từng được đánh giá.
 */
export function useSubmitFeedback() {
  const queryClient = useQueryClient()
  return useMutation<unknown, AppError, FeedbackInput>({
    mutationFn: (data) => api.post('/driver/feedbacks', data),
    onSuccess: () => {
      toast.success('Cảm ơn bạn đã đánh giá!')
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionHistory })
    },
    onError: (error) => toast.error(error.message),
  })
}
