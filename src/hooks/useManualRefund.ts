import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface ManualRefundSubmitRequest {
  reservationId: string;
  reason: string;
  bankInfo: string;
}

export interface ManualRefundResponse {
  id: string;
  reservationId: string;
  licensePlate: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  depositAmount: number;
  reason: string;
  bankInfo: string;
  status: string;
  requestedAt: string;
  processedAt?: string;
}

export function useSubmitManualRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ManualRefundSubmitRequest) => {
      const response = await apiClient.post<{ data: ManualRefundResponse }>(
        "/driver/manual-refunds",
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRefundRequests"] });
      queryClient.invalidateQueries({ queryKey: ["myReservations"] });
    },
  });
}

export function useMyRefundRequests() {
  return useQuery({
    queryKey: ["myRefundRequests"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ManualRefundResponse[] }>(
        "/driver/manual-refunds"
      );
      return response.data.data;
    },
  });
}
