import { useState } from 'react'
import { X, HandCoins, AlertCircle } from 'lucide-react'
import { useSubmitManualRefund } from '@/hooks/useManualRefund'

interface ManualRefundModalProps {
  reservationId: string
  depositAmount: number
  onClose: () => void
}

export function ManualRefundModal({ reservationId, depositAmount, onClose }: ManualRefundModalProps) {
  const [reason, setReason] = useState('')
  const [bankInfo, setBankInfo] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const submitRefund = useSubmitManualRefund()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!reason.trim() || !bankInfo.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin')
      return
    }

    submitRefund.mutate(
      { reservationId, reason, bankInfo },
      {
        onSuccess: () => {
          setSuccessMsg('Gửi yêu cầu hoàn cọc thành công!')
          setTimeout(onClose, 1500)
        },
        onError: (error: any) => {
          setErrorMsg(error?.message || 'Có lỗi xảy ra, vui lòng thử lại')
        }
      }
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <HandCoins className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Yêu cầu hoàn cọc thủ công</h3>
            <p className="text-sm text-gray-500">Mã đặt chỗ: #{reservationId}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              {successMsg}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số tiền cọc cần hoàn
            </label>
            <div className="p-3 bg-gray-50 rounded-lg text-gray-900 font-semibold border border-gray-200">
              {new Intl.NumberFormat('vi-VN').format(depositAmount)} ₫
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do xin hoàn cọc <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px]"
              placeholder="Ví dụ: Đã hủy do bận việc đột xuất, xin hoàn cọc..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thông tin nhận tiền (Ngân hàng) <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={bankInfo}
              onChange={(e) => setBankInfo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px]"
              placeholder="Tên ngân hàng - Số tài khoản - Tên chủ thẻ (Ví dụ: MB Bank - 123456789 - NGUYEN VAN A)"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitRefund.isPending}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitRefund.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
