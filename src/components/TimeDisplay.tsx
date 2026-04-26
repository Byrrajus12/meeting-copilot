'use client'

import { Doto } from 'next/font/google'
import { useEffect, useState } from 'react'

const doto = Doto({ subsets: ['latin'] })

export default function TimeDisplay() {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    function updateTime() {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      setTime(`${hours}:${minutes}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!time) return null

  return (
    <div className="flex items-center justify-center py-2">
      <span className={`${doto.className} text-lg tracking-[0.3em] text-neutral-500`}>
        {time}
      </span>
    </div>
  )
}
