'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { api, type AppError } from '@/lib/api'
import type { DriverForgotPasswordProps } from './types'

// Buoc 1: nhap dinh danh (username/email/SDT) de nhan OTP.
const requestSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập email, số điện thoại hoặc tên đăng nhập'),
})
type RequestFields = z.infer<typeof requestSchema>

// Buoc 2: nhap OTP + mat khau moi. Rang buoc do dai khop BE (6-50) va OTP 6 chu so.
const resetSchema = z
  .object({
    otp: z.string().regex(/^\d{6}$/, 'Mã OTP gồm 6 chữ số'),
    newPassword: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
      .max(50, 'Mật khẩu tối đa 50 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
type ResetFields = z.infer<typeof resetSchema>

const inputClass =
  'peer w-full bg-transparent border border-[#c2c6d6] rounded-xl py-3 pl-12 pr-4 text-[#191c1e] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] outline-none transition-all disabled:opacity-50'
const labelClass =
  'absolute left-11 top-1/2 -translate-y-1/2 text-[#45464d] text-sm transition-all duration-200 pointer-events-none px-1 bg-white peer-focus:top-0 peer-focus:scale-85 peer-focus:text-[#0058be] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:scale-85'

export function DriverForgotPassword({ onSwitchToLogin }: DriverForgotPasswordProps) {
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [identifier, setIdentifier] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const requestForm = useForm<RequestFields>({
    resolver: zodResolver(requestSchema),
    defaultValues: { identifier: '' },
  })

  const resetForm = useForm<ResetFields>({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  })

  // Goi /auth/forgot-password. `data` la email da che (vd "ngu***@gmail.com").
  async function sendOtp(id: string): Promise<boolean> {
    setIsSubmitting(true)
    try {
      const masked = await api.post<string>('/auth/forgot-password', { identifier: id })
      setMaskedEmail(masked)
      toast.success(`Đã gửi mã OTP tới ${masked}`)
      return true
    } catch (err) {
      toast.error((err as AppError)?.message || 'Không gửi được mã OTP')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const onRequest = async (data: RequestFields) => {
    const ok = await sendOtp(data.identifier.trim())
    if (ok) {
      setIdentifier(data.identifier.trim())
      setStep('reset')
    }
  }

  const onReset = async (data: ResetFields) => {
    setIsSubmitting(true)
    try {
      await api.post<void>('/auth/reset-password', {
        otp: data.otp,
        newPassword: data.newPassword,
      })
      toast.success('Đặt lại mật khẩu thành công. Vui lòng đăng nhập.')
      onSwitchToLogin()
    } catch (err) {
      toast.error((err as AppError)?.message || 'Đặt lại mật khẩu thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-[28px] font-semibold leading-9 tracking-tight text-[#191c1e] mb-1">
          Quên mật khẩu
        </h1>
        <p className="text-sm text-[#45464d]">
          {step === 'request'
            ? 'Nhập email, số điện thoại hoặc tên đăng nhập — chúng tôi sẽ gửi mã OTP tới email của bạn.'
            : `Nhập mã OTP 6 số vừa gửi tới ${maskedEmail} và mật khẩu mới.`}
        </p>
      </div>

      {step === 'request' ? (
        <form onSubmit={requestForm.handleSubmit(onRequest)} className="space-y-6" noValidate>
          <div className="relative pt-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] z-10 text-[20px]">
                alternate_email
              </span>
              <input
                {...requestForm.register('identifier')}
                type="text"
                placeholder=" "
                disabled={isSubmitting}
                aria-label="Email, số điện thoại hoặc tên đăng nhập"
                className={inputClass}
              />
              <label className={labelClass}>Email, SĐT hoặc tên đăng nhập</label>
            </div>
            {requestForm.formState.errors.identifier && (
              <p className="mt-1 text-xs text-[#ba1a1a]">
                {requestForm.formState.errors.identifier.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0058be] hover:bg-[#0058be]/90 text-white text-[20px] font-semibold leading-7 py-3 rounded-xl shadow-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? 'Đang gửi...' : 'Gửi mã OTP'}</span>
            {!isSubmitting && <span className="material-symbols-outlined text-[20px]">send</span>}
          </button>
        </form>
      ) : (
        <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-6" noValidate>
          {/* OTP */}
          <div className="relative pt-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] z-10 text-[20px]">
                pin
              </span>
              <input
                {...resetForm.register('otp')}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder=" "
                disabled={isSubmitting}
                aria-label="Mã OTP"
                className={`${inputClass} tracking-[0.4em] font-mono`}
              />
              <label className={labelClass}>Mã OTP (6 số)</label>
            </div>
            {resetForm.formState.errors.otp && (
              <p className="mt-1 text-xs text-[#ba1a1a]">{resetForm.formState.errors.otp.message}</p>
            )}
          </div>

          {/* New password */}
          <div className="relative pt-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] z-10 text-[20px]">
                lock
              </span>
              <input
                {...resetForm.register('newPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder=" "
                disabled={isSubmitting}
                aria-label="Mật khẩu mới"
                className={`${inputClass} pr-12`}
              />
              <label className={labelClass}>Mật khẩu mới</label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727785] hover:text-[#45464d] transition-colors"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {resetForm.formState.errors.newPassword && (
              <p className="mt-1 text-xs text-[#ba1a1a]">
                {resetForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="relative pt-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] z-10 text-[20px]">
                lock_reset
              </span>
              <input
                {...resetForm.register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder=" "
                disabled={isSubmitting}
                aria-label="Xác nhận mật khẩu mới"
                className={inputClass}
              />
              <label className={labelClass}>Xác nhận mật khẩu mới</label>
            </div>
            {resetForm.formState.errors.confirmPassword && (
              <p className="mt-1 text-xs text-[#ba1a1a]">
                {resetForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0058be] hover:bg-[#0058be]/90 text-white text-[20px] font-semibold leading-7 py-3 rounded-xl shadow-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}</span>
            {!isSubmitting && (
              <span className="material-symbols-outlined text-[20px]">lock_open</span>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => sendOtp(identifier)}
              disabled={isSubmitting}
              className="text-sm text-[#0058be] font-medium hover:underline transition-colors disabled:opacity-60"
            >
              Chưa nhận được mã? Gửi lại
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 text-center md:text-left">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-[#0058be] font-medium hover:underline transition-all inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại đăng nhập
        </button>
      </div>
    </div>
  )
}
