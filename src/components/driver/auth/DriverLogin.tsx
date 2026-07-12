'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'
import type { DriverLoginProps, DriverLoginFields } from './types'

const schema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email hoặc số điện thoại'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  remember: z.boolean().optional(),
})

export function DriverLogin({ onSwitchToRegister, onSwitchToForgot }: DriverLoginProps) {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuthStore()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DriverLoginFields & { remember?: boolean }>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: false },
  })

  const onSubmit = async (data: DriverLoginFields) => {
    try {
      await login(data.email, data.password)
      router.push('/driver')
    } catch {
      // toast shown by store
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-[28px] font-semibold leading-9 tracking-tight text-[#191c1e] mb-1">
          Đăng nhập
        </h1>
        <p className="text-sm text-[#45464d]">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-[#0058be] font-medium hover:underline transition-all"
          >
            Đăng ký ngay
          </button>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Email */}
        <div className="relative pt-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] z-10 text-[20px]">
              person
            </span>
            <input
              {...register('email')}
              type="text"
              placeholder=" "
              disabled={isLoading}
              aria-label="Email hoặc Số điện thoại"
              className="peer w-full bg-transparent border border-[#c2c6d6] rounded-xl py-3 pl-12 pr-4 text-[#191c1e] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] outline-none transition-all disabled:opacity-50"
            />
            <label className="absolute left-11 top-1/2 -translate-y-1/2 text-[#45464d] text-sm transition-all duration-200 pointer-events-none px-1 bg-white peer-focus:top-0 peer-focus:scale-85 peer-focus:text-[#0058be] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:scale-85">
              Email hoặc Số điện thoại
            </label>
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-[#ba1a1a]">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="relative pt-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] z-10 text-[20px]">
              lock
            </span>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder=" "
              disabled={isLoading}
              aria-label="Mật khẩu"
              className="peer w-full bg-transparent border border-[#c2c6d6] rounded-xl py-3 pl-12 pr-12 text-[#191c1e] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] outline-none transition-all disabled:opacity-50"
            />
            <label className="absolute left-11 top-1/2 -translate-y-1/2 text-[#45464d] text-sm transition-all duration-200 pointer-events-none px-1 bg-white peer-focus:top-0 peer-focus:scale-85 peer-focus:text-[#0058be] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:scale-85">
              Mật khẩu
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727785] hover:text-[#45464d] transition-colors"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-[#ba1a1a]">{errors.password.message}</p>
          )}
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              {...register('remember')}
              type="checkbox"
              className="rounded border-[#c2c6d6] text-[#0058be] focus:ring-[#0058be] w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-[#45464d] group-hover:text-[#191c1e] transition-colors">
              Ghi nhớ đăng nhập
            </span>
          </label>
          <button
            type="button"
            onClick={onSwitchToForgot}
            className="text-sm text-[#0058be] hover:underline font-medium transition-colors"
          >
            Quên mật khẩu?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#0058be] hover:bg-[#0058be]/90 text-white text-[20px] font-semibold leading-7 py-3 rounded-xl shadow-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span>{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
          {!isLoading && (
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          )}
        </button>
      </form>
    </div>
  )
}
