'use client'

import { useState } from 'react'
import { DriverLogin } from './DriverLogin'
import { DriverRegister } from './DriverRegister'

type Tab = 'login' | 'register'

export function DriverAuth() {
  const [tab, setTab] = useState<Tab>('login')

  return (
    <div className="w-full h-screen flex flex-col md:flex-row font-[Inter,system-ui,sans-serif]">
      {/* Left panel — immersive illustration */}
      <div
        className="hidden md:flex md:w-1/2 flex-col justify-end relative overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC6RL3xe3sC9eFHP8iIZC3AbqKdBg2X9F5BRdVEGHn2Rs_lp3UWUQ9A7hlXy8dRg-33mbrbqMsLZWSkHawbgYFSJ94EdL2HzFjIiI9oZSJCIvfx67SyiicoqZWz5K0NJ5KXQFtBH79-BvOffvD-scqE-CwWMPZ-S3zIM2Ve-Zc7CVIKv4BB8c3seM1p8GXqJfBdKebtLdMUo_ei9E8_WJOwvETm6B_gYzWx7ceCvm8C9KZcS8wBeYPqkiIlLWUuijOxnEyvAxrhN_k')",
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative z-10 p-8 pb-12 text-white">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="material-symbols-outlined text-[40px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              directions_car
            </span>
          </div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight mb-2">
            Chào mừng bạn đến với ParkFlow Pro
          </h2>
          <p className="text-base opacity-90 max-w-lg leading-relaxed">
            Trải nghiệm giải pháp đỗ xe thông minh, an toàn và hoàn toàn tự động hóa dành cho bạn.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center overflow-y-auto p-6 md:p-10">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile branding */}
          <div className="md:hidden flex items-center justify-center gap-2 mb-8">
            <span
              className="material-symbols-outlined text-[#0058be] text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              directions_car
            </span>
            <span className="text-[#0058be] text-xl font-semibold">ParkFlow Pro</span>
          </div>

          {tab === 'login' ? (
            <DriverLogin onSwitchToRegister={() => setTab('register')} />
          ) : (
            <DriverRegister onSwitchToLogin={() => setTab('login')} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  )
}
