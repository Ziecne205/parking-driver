'use client'

import { useState } from 'react'
import { ArrowLeft, Star, CheckCircle2, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useSessionHistory, useSubmitFeedback, type DriverSession } from '@/hooks/useFeedback'

interface FeedbackProps {
  readonly onBack: () => void
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatVnd(amount?: number | null): string {
  if (amount == null) return '—'
  return `${amount.toLocaleString('vi-VN')} ₫`
}

/** Thẻ đánh giá 1 phiên đỗ: sao (1–5) + nhận xét, giữ state riêng để nhiều phiên độc lập. */
function SessionRatingCard({ session }: { readonly session: DriverSession }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { mutate, isPending } = useSubmitFeedback()

  function handleSubmit() {
    if (rating < 1) return
    mutate(
      { sessionId: session.sessionId, rating, comment: comment.trim() || undefined },
      { onSuccess: () => setSubmitted(true) },
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Car className="h-5 w-5 text-blue-600" />
        <span className="font-mono font-bold text-gray-900">{session.licensePlateIn}</span>
        <span className="ml-auto text-xs text-gray-400">#{session.sessionId}</span>
      </div>
      <div className="mb-4 space-y-0.5 text-xs text-gray-500">
        <p>Vào: {formatDateTime(session.entryTime)}</p>
        <p>Ra: {formatDateTime(session.exitTime)}</p>
        <p>Phí: {formatVnd(session.estimatedFee)}</p>
      </div>

      {submitted ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Cảm ơn bạn đã đánh giá!
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} sao`}
                onClick={() => setRating(value)}
                className="p-0.5"
              >
                <Star
                  className={`h-7 w-7 ${
                    value <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            className="mt-3 text-sm"
            placeholder="Nhận xét thêm (không bắt buộc)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
          <Button className="mt-3 w-full" disabled={rating < 1 || isPending} onClick={handleSubmit}>
            {isPending ? 'Đang gửi…' : 'Gửi đánh giá'}
          </Button>
        </>
      )}
    </div>
  )
}

/** Tab "Đánh giá" của tài xế: liệt kê các phiên ĐÃ HOÀN THÀNH để tự đánh giá. */
export function Feedback({ onBack }: FeedbackProps) {
  const { data: sessions = [], isLoading } = useSessionHistory()
  const completed = sessions.filter((s) => s.status === 'Completed')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-lg font-bold text-gray-900">Đánh giá</h1>
          <span className="text-sm text-gray-400">{completed.length} phiên</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-5">
        <p className="text-sm text-gray-600">
          Đánh giá trải nghiệm cho các phiên đỗ xe đã hoàn thành của bạn.
        </p>

        {isLoading ? (
          <div className="py-16 text-center text-gray-500">Đang tải…</div>
        ) : completed.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
            Chưa có phiên đỗ hoàn thành nào để đánh giá.
          </div>
        ) : (
          completed.map((session) => <SessionRatingCard key={session.sessionId} session={session} />)
        )}
      </main>
    </div>
  )
}
