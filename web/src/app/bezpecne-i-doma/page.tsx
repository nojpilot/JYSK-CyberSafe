'use client'

import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'

export default function HomeSafePage() {
  const [tips, setTips] = useState<string[]>([])

  useEffect(() => {
    apiGet<{ tips: string[] }>('/api/home-tips').then((data) => setTips(data.tips)).catch(() => {})
  }, [])

  return (
    <section className="card space-y-3">
      <h1 className="text-3xl font-semibold">Bezpečně i doma</h1>
      <p className="text-slate-300">Rychlé tipy, které se hodí i mimo práci.</p>
      <ul className="list-disc pl-6 text-slate-300 space-y-1">
        {tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </section>
  )
}
