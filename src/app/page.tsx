'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// App tài xế — mọi route đều dưới /driver; /driver tự xử lý auth (→ /driver/auth).
export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/driver')
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Đang chuyển hướng...</h1>
      </div>
    </main>
  )
}
