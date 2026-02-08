'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiGet } from '@/lib/api'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

type Module = {
  title: string
  story: string
  correct_action: string
  tip1: string
  tip2: string
  image?: string
}

export default function ModulePage() {
  const params = useParams<{ step: string }>()
  const step = Number(params.step)
  const [data, setData] = useState<{
    module: Module
    step: number
    total: number
    progress: { stepIndex: number; totalSteps: number; progress: number }
  } | null>(null)

  useEffect(() => {
    if (!step) return
    apiGet<{
      module: Module
      step: number
      total: number
      progress: { stepIndex: number; totalSteps: number; progress: number }
    }>(`/api/modules/${step}`)
      .then((res) => setData(res))
      .catch(() => {})
  }, [step])

  if (!data) return <div className="card">Načítám…</div>

  const { module, total, progress } = data

  return (
    <section className="card space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <span className="kicker">Směna v akci</span>
          <p className="text-sm text-slate-400">Modul {step}/{total}</p>
          <h1 className="text-3xl font-semibold">{module.title}</h1>
        </div>
        <div className="progress-pill">Krok {progress.stepIndex}/{progress.totalSteps}</div>
      </div>
      <div className="progress-wrap">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress.progress}%` }} />
        </div>
      </div>
      {module.image && (
        <img src={module.image} alt={module.title} className="w-full h-56 object-contain rounded-2xl p-4" />
      )}
      <p className="text-lg text-slate-300">{module.story}</p>
      <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20">
        <strong>Co je správně:</strong>
        <p>{module.correct_action}</p>
      </div>
      <ul className="list-disc pl-6 text-slate-300">
        <li>{module.tip1}</li>
        <li>{module.tip2}</li>
      </ul>
      <div className="flex gap-3">
        <Link className="btn btn-secondary" href={step === 1 ? '/pre-test' : `/kurz/${step - 1}`}>Zpět</Link>
        <LiquidButton href={step === total ? '/post-test' : `/kurz/${step + 1}`}>Další</LiquidButton>
      </div>
    </section>
  )
}
