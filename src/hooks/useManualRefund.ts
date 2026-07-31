import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
      return api.post<ManualRefundResponse>("/driver/manual-refunds", data);
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
      return api.get<ManualRefundResponse[]>("/driver/manual-refunds");
    },
  });
}
