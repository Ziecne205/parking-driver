'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuthStore } from '@/store'
import type { DriverRegisterProps, DriverRegisterFields } from './types'

const schema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ và tên'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  licensePlate: z.string().optional(),
})

export function DriverRegister({ onSwitchToLogin }: DriverRegisterProps) {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, isLoading } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DriverRegisterFields>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', phone: '', email: '', password: '', licensePlate: '' },
  })

  const onSubmit = async (data: DriverRegisterFields) => {
    try {
      await registerUser(data)
    } catch {
      // toast shown by store
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-[28px] font-semibold leading-9 tracking-tight text-[#191c1e] mb-1">
          Tạo tài khoản
        </h1>
        <p className="text-sm text-[#45464d]">
          Đã có tài khoản?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#0058be] font-medium hover:underline transition-all"
          >
            Đăng nhập
          </button>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Full name */}
        <div className="relative pt-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] z-10 text-[20px]">
              badge
            </span>
            <input
              {...register('fullName')}
              type="text"
              placeholder=" "
              disabled={isLoading}
              aria-label="Họ và tên"
              className="peer w-full bg-transparent border border-[#c2c6d6] rounded-xl py-3 pl-12 pr-4 text-[#191c1e] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] outline-none transition-all disabled:opacity-50"
            />
            <label className="absolute left-11 top-1/2 -translate-y-1/2 text-[#45464d] text-sm transition-all duration-200 pointer-events-none px-1 bg-white peer-focus:top-0 peer-focus:scale-85 peer-focus:text-[#0058be] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:scale-85">
              Họ và tên
            </label>
          </div>
          {errors.fullName && (
            <p className="mt-1 text-xs text-[#ba1a1a]">{errors.fullName.message}</p>
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
                {...register('phone')}
                type="tel"
                placeholder=" "
                disabled={isLoading}
                aria-label="Số điện thoại"
                className="peer w-full bg-transparent border border-[#c2c6d6] rounded-xl py-3 pl-12 pr-4 text-[#191c1e] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] outline-none transition-all disabled:opacity-50"
              />
              <label className="absolute left-11 top-1/2 -translate-y-1/2 text-[#45464d] text-sm transition-all duration-200 pointer-events-none px-1 bg-white peer-focus:top-0 peer-focus:scale-85 peer-focus:text-[#0058be] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:scale-85">
                Số điện thoại
              </label>
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-[#ba1a1a]">{errors.phone.message}</p>
            )}
          </div>

          <div className="relative pt-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] z-10 text-[20px]">
                mail
              </span>
              <input
                {...register('email')}
                type="email"
                placeholder=" "
                disabled={isLoading}
                aria-label="Email"
                className="peer w-full bg-transparent border border-[#c2c6d6] rounded-xl py-3 pl-12 pr-4 text-[#191c1e] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] outline-none transition-all disabled:opacity-50"
              />
              <label className="absolute left-11 top-1/2 -translate-y-1/2 text-[#45464d] text-sm transition-all duration-200 pointer-events-none px-1 bg-white peer-focus:top-0 peer-focus:scale-85 peer-focus:text-[#0058be] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:scale-85">
                Email
              </label>
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-[#ba1a1a]">{errors.email.message}</p>
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
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder=" "
              disabled={isLoading}
              aria-label="Tạo mật khẩu"
              className="peer w-full bg-transparent border border-[#c2c6d6] rounded-xl py-3 pl-12 pr-12 text-[#191c1e] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] outline-none transition-all disabled:opacity-50"
            />
            <label className="absolute left-11 top-1/2 -translate-y-1/2 text-[#45464d] text-sm transition-all duration-200 pointer-events-none px-1 bg-white peer-focus:top-0 peer-focus:scale-85 peer-focus:text-[#0058be] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:scale-85">
              Tạo mật khẩu
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

        {/* License plate (optional) */}
        <div className="relative pt-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] z-10 text-[20px]">
              directions_car
            </span>
            <input
              {...register('licensePlate')}
              type="text"
              placeholder=" "
              disabled={isLoading}
              aria-label="Biển số xe"
              className="peer w-full bg-transparent border border-[#c2c6d6] rounded-xl py-3 pl-12 pr-4 text-[#191c1e] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] outline-none transition-all disabled:opacity-50"
            />
            <label className="absolute left-11 top-1/2 -translate-y-1/2 text-[#45464d] text-sm transition-all duration-200 pointer-events-none px-1 bg-white peer-focus:top-0 peer-focus:scale-85 peer-focus:text-[#0058be] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:scale-85">
              Biển số xe (Tùy chọn)
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#0058be] hover:bg-[#0058be]/90 text-white text-[20px] font-semibold leading-7 py-3 rounded-xl shadow-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-8 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span>{isLoading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}</span>
          {!isLoading && (
            <span className="material-symbols-outlined text-[20px]">person_add</span>
          )}
        </button>
      </form>
    </div>
  )
}
