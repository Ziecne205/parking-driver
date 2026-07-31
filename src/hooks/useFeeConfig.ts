import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface FeeConfig {
  cancelWindowMinutes: number
  depositPaymentWindowMinutes: number
  depositPercent: number
  noShowGraceMinutes: number
  blacklistThreshold: number
}

export function useFeeConfig() {
  return useQuery({
    queryKey: ['feeConfig'],
    queryFn: () => api.get<FeeConfig>('/manager/fee-config'),
    staleTime: 5 * 60 * 1000, // cache 5 phút, không cần refetch liên tục
  })
}
