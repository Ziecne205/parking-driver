'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User, Mail, Phone, Save } from 'lucide-react'
import type { ReadonlyAccountFormProps, AccountFormFields } from './types'

const schema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ'),
})

export function AccountForm({ user, isSubmitting, onSubmit }: ReadonlyAccountFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AccountFormFields>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: user.fullName, phone: user.phone ?? '', email: user.email },
  })

  useEffect(() => {
    reset({ fullName: user.fullName, phone: user.phone ?? '', email: user.email })
  }, [user, reset])

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Thông tin tài khoản</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Full name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Họ tên <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              {...register('fullName')}
              type="text"
              disabled={isSubmitting}
              placeholder="Nguyễn Văn A"
              aria-label="Họ tên"
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors disabled:opacity-50 ${
                errors.fullName
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              }`}
            />
          </div>
          {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Số điện thoại
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              {...register('phone')}
              type="tel"
              disabled={isSubmitting}
              placeholder="0901234567"
              aria-label="Số điện thoại"
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors disabled:opacity-50 ${
                errors.phone
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              }`}
            />
          </div>
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              {...register('email')}
              type="email"
              disabled={isSubmitting}
              placeholder="email@example.com"
              aria-label="Email"
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors disabled:opacity-50 ${
                errors.email
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              }`}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </section>
  )
}
