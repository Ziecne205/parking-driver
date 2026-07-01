// Example usage of error normalizer with Spring Boot backend

import { normalizeSpringBootError, handleApiError, ErrorCodes } from '@/lib/errors'
import { toast } from 'sonner'

// ============================================
// Example 1: Using in React Query hooks
// ============================================

export function useSlots() {
  return useQuery({
    queryKey: ['slots'],
    queryFn: async () => {
      const response = await fetch('/api/slots')
      if (!response.ok) {
        throw await handleApiError(response)
      }
      return response.json()
    },
    throwOnError: (error) => {
      const appError = normalizeSpringBootError(error)
      toast.error(appError.message)
      return false
    },
  })
}

// ============================================
// Example 2: Handling validation errors
// ============================================

export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateBookingInput) => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw await handleApiError(response)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Tạo đặt chỗ thành công')
    },
    onError: (error) => {
      const appError = normalizeSpringBootError(error)

      // Handle validation errors with field-specific messages
      if (appError.code === ErrorCodes.VALIDATION_ERROR && appError.details?.validationErrors) {
        const validationErrors = appError.details.validationErrors as Array<{
          field: string
          message: string
          rejectedValue: unknown
        }>

        // Show first validation error
        if (validationErrors.length > 0) {
          toast.error(`${validationErrors[0].field}: ${validationErrors[0].message}`)
        }
      } else {
        // Show generic error message
        toast.error(appError.message)
      }

      // Handle specific business logic errors
      if (appError.code === ErrorCodes.SLOT_NOT_AVAILABLE) {
        // Refresh slot list and show modal again
        queryClient.invalidateQueries({ queryKey: ['slots'] })
      }
    },
  })
}

// ============================================
// Example 3: Using in Next.js API routes
// ============================================

// src/app/api/slots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { normalizeSpringBootError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080'
    const token = request.headers.get('Authorization')

    const response = await fetch(`${backendUrl}/api/slots`, {
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      const appError = normalizeSpringBootError(errorData)

      // Log error for debugging
      console.error('Spring Boot API error:', {
        path: request.url,
        status: appError.status,
        code: appError.code,
        message: appError.message,
      })

      return NextResponse.json(appError, { status: appError.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const appError = normalizeSpringBootError(error)

    // Log unexpected errors
    console.error('Unexpected error in API route:', error)

    return NextResponse.json(appError, { status: appError.status })
  }
}

// ============================================
// Example 4: Handling authentication errors
// ============================================

export function useLogin() {
  const { setUser } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw await handleApiError(response)
      }

      return response.json()
    },
    onSuccess: (data) => {
      setUser(data.user)
      toast.success('Đăng nhập thành công')
      router.push('/dashboard')
    },
    onError: (error) => {
      const appError = normalizeSpringBootError(error)

      // Handle specific auth errors
      switch (appError.code) {
        case ErrorCodes.INVALID_CREDENTIALS:
          toast.error('Email hoặc mật khẩu không đúng')
          break
        case ErrorCodes.TOKEN_EXPIRED:
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại')
          router.push('/login')
          break
        case ErrorCodes.UNAUTHORIZED:
          toast.error('Vui lòng đăng nhập để tiếp tục')
          router.push('/login')
          break
        default:
          toast.error(appError.message)
      }
    },
  })
}

// ============================================
// Example 5: Network error handling
// ============================================

export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSessionInput) => {
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw await handleApiError(response)
        }

        return response.json()
      } catch (error) {
        // Network errors (fetch failures) are caught here
        throw normalizeSpringBootError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      toast.success('Tạo phiên đỗ xe thành công')
    },
    onError: (error) => {
      const appError = normalizeSpringBootError(error)

      // Handle network errors specifically
      if (appError.code === ErrorCodes.NETWORK_ERROR) {
        toast.error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại')
      } else {
        toast.error(appError.message)
      }
    },
  })
}

// ============================================
// Example 6: Error logging and monitoring
// ============================================

function logError(appError: AppError, context?: Record<string, unknown>) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('AppError:', {
      ...appError,
      context,
    })
  }

  // Send to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry, LogRocket, etc.
    // Sentry.captureException(appError, { extra: context })
  }
}

export function useUpdateSlotStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ slotId, status }: { slotId: string; status: SlotStatus }) => {
      const response = await fetch(`/api/slots/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw await handleApiError(response)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      toast.success('Cập nhật trạng thái chỗ đỗ thành công')
    },
    onError: (error, variables) => {
      const appError = normalizeSpringBootError(error)

      // Log error with context
      logError(appError, {
        operation: 'updateSlotStatus',
        slotId: variables.slotId,
        newStatus: variables.status,
      })

      toast.error(appError.message)
    },
  })
}
