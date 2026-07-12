'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'
import type { DriverRegisterProps, DriverRegisterFields } from './types'

// Buoc 1: thong tin tai khoan (co xac nhan mat khau). Do dai mat khau khop BE (6-50).
const infoSchema = z
  .object({
    fullName: z.string().min(1, 'Vui lòng nhập họ và tên'),
    phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    password: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
      .max(50, 'Mật khẩu tối đa 50 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

// Buoc 2: OTP 6 so gui toi email.
const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'Mã OTP gồm 6 chữ số'),
})
type OtpFields = z.infer<typeof otpSchema>

const inputClass =
  'peer w-full bg-transparent border border-[#c2c6d6] rounded-xl py-3 pl-12 pr-4 text-[#191c1e] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] outline-none transition-all disabled:opacity-50'
const labelClass =
  'absolute left-11 top-1/2 -translate-y-1/2 text-[#45464d] text-sm transition-all duration-200 pointer-events-none px-1 bg-white peer-focus:top-0 peer-focus:scale-85 peer-focus:text-[#0058be] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:scale-85'

export function DriverRegister({ onSwitchToLogin }: DriverRegisterProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'info' | 'otp'>('info')
  const [fields, setFields] = useState<DriverRegisterFields | null>(null)
  const [maskedEmail, setMaskedEmail] = useState('')
  const { registerSendOtp, registerVerify, isLoading } = useAuthStore()
  const router = useRouter()

  const infoForm = useForm<DriverRegisterFields>({
    resolver: zodResolver(infoSchema),
    defaultValues: { fullName: '', phone: '', email: '', password: '', confirmPassword: '' },
  })

  const otpForm = useForm<OtpFields>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  })

  // Bo confirmPassword khi goi API (BE khong can).
  const toPayload = (f: DriverRegisterFields) => ({
    fullName: f.fullName,
    phone: f.phone,
    email: f.email,
    password: f.password,
  })

  const onInfo = async (data: DriverRegisterFields) => {
    try {
      const masked = await registerSendOtp(toPayload(data))
      setFields(data)
      setMaskedEmail(masked)
      otpForm.reset({ otp: '' })
      setStep('otp')
    } catch {
      // toast shown by store
    }
  }

  const onOtp = async (data: OtpFields) => {
    if (!fields) return
    try {
      await registerVerify(toPayload(fields), data.otp)
      router.push('/driver')
    } catch {
      // toast shown by store
    }
  }

  const handleResend = async () => {
    if (!fields) return
    try {
      const masked = await registerSendOtp(toPayload(fields))
      setMaskedEmail(masked)
    } catch {
      // toast shown by store
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-[28px] font-semibold leading-9 tracking-tight text-[#191c1e] mb-1">
          {step === 'info' ? 'Tạo tài khoản' : 'Xác nhận email'}
        </h1>
        <p className="text-sm text-[#45464d]">
          {step === 'info' ? (
            <>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-[#0058be] font-medium hover:underline transition-all"
              >
                Đăng nhập
              </button>
            </>
          ) : (
            `Nhập mã OTP 6 số vừa gửi tới ${maskedEmail} để hoàn tất đăng ký.`
          )}
        </p>
      </div>

      {step === 'info' ? (
        <form onSubmit={infoForm.handleSubmit(onInfo)} className="space-y-4" noValidate>
          {/* Full name */}
          <div className="relative pt-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] z-10 text-[20px]">
                badge
              </span>
              <input
                {...infoForm.register('fullName')}
                type="text"
                placeholder=" "
                disabled={isLoading}
                aria-label="Họ và tên"
                className={inputClass}
              />
              <label className={labelClass}>Họ và tên</label>
            </div>
            {infoForm.formState.errors.fullName && (
              <p className="mt-1 text-xs text-[#ba1a1a]">
                {infoForm.formState.errors.fullName.message}
              </p>
            )}
          </div>

          {/* Phone + Email row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative pt-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] z-10 text-[20px]">
                  phone_iphone
                </span>
                <input
                  {...infoForm.register('phone')}
                  type="tel"
                  placeholder=" "
                  disabled={isLoading}
                  aria-label="Số điện thoại"
                  className={inputClass}
                />
                <label className={labelClass}>Số điện thoại</label>
              </div>
              {infoForm.formState.errors.phone && (
                <p className="mt-1 text-xs text-[#ba1a1a]">
                  {infoForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="relative pt-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] z-10 text-[20px]">
                  mail
                </span>
                <input
                  {...infoForm.register('email')}
                  type="email"
                  placeholder=" "
                  disabled={isLoading}
                  aria-label="Email"
                  className={inputClass}
                />
                <label className={labelClass}>Email</label>
              </div>
              {infoForm.formState.errors.email && (
                <p className="mt-1 text-xs text-[#ba1a1a]">
                  {infoForm.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="relative pt-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] z-10 text-[20px]">
                lock
              </span>
              <input
                {...infoForm.register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder=" "
                disabled={isLoading}
                aria-label="Tạo mật khẩu"
                className={`${inputClass} pr-12`}
              />
              <label className={labelClass}>Tạo mật khẩu</label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727785] hover:text-[#45464d] transition-colors"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {infoForm.formState.errors.password && (
              <p className="mt-1 text-xs text-[#ba1a1a]">
                {infoForm.formState.errors.password.message}
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
                {...infoForm.register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder=" "
                disabled={isLoading}
                aria-label="Xác nhận mật khẩu"
                className={inputClass}
              />
              <label className={labelClass}>Xác nhận mật khẩu</label>
            </div>
            {infoForm.formState.errors.confirmPassword && (
              <p className="mt-1 text-xs text-[#ba1a1a]">
                {infoForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0058be] hover:bg-[#0058be]/90 text-white text-[20px] font-semibold leading-7 py-3 rounded-xl shadow-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-8 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isLoading ? 'Đang gửi mã...' : 'Tiếp tục'}</span>
            {!isLoading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
          </button>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(onOtp)} className="space-y-6" noValidate>
          <div className="relative pt-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] z-10 text-[20px]">
                pin
              </span>
              <input
                {...otpForm.register('otp')}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder=" "
                disabled={isLoading}
                aria-label="Mã OTP"
                className={`${inputClass} tracking-[0.4em] font-mono`}
              />
              <label className={labelClass}>Mã OTP (6 số)</label>
            </div>
            {otpForm.formState.errors.otp && (
              <p className="mt-1 text-xs text-[#ba1a1a]">{otpForm.formState.errors.otp.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0058be] hover:bg-[#0058be]/90 text-white text-[20px] font-semibold leading-7 py-3 rounded-xl shadow-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isLoading ? 'Đang xác nhận...' : 'Hoàn tất đăng ký'}</span>
            {!isLoading && <span className="material-symbols-outlined text-[20px]">check_circle</span>}
          </button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('info')}
              disabled={isLoading}
              className="text-sm text-[#45464d] font-medium hover:underline transition-colors disabled:opacity-60 inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Sửa thông tin
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading}
              className="text-sm text-[#0058be] font-medium hover:underline transition-colors disabled:opacity-60"
            >
              Gửi lại mã
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
