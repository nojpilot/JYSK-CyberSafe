'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiGet } from '@/lib/api'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

type Course = {
  duration: string
  storyline: string
  mission: string
  teamMotto: string
  rules: string[]
}

type Module = {
  title: string
  story: string
  image?: string
  slug: string
}

type Team = {
  level: number
  levelLabel: string
  completed: number
  sessions: number
  avgImprovement: number
  shieldScore: number
}

export default function LandingPage() {
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [team, setTeam] = useState<Team | null>(null)
  useEffect(() => {
    apiGet<{ course: Course; modules: Module[]; team: Team }>('/api/landing')
      .then((data) => {
        setCourse(data.course)
        setModules(data.modules)
        setTeam(data.team)
      })
      .catch(() => {})
  }, [])

  if (!course || !team) {
    return <div className="card">Načítám…</div>
  }

  return (
    <>
      <section className="card hero">
        <div className="space-y-4">
          <span className="kicker">Mikro‑kurz pro směnu</span>
          <h1 className="text-4xl font-semibold">{course.storyline}</h1>
          <p className="text-lg text-slate-300">{course.mission}</p>
          <p className="text-sm text-slate-400">{course.teamMotto}</p>
          <div className="flex flex-wrap gap-3 items-center">
            <LiquidButton href="/pre-test">Začít kurz</LiquidButton>
          </div>
          <div className="stat-grid">
            <div className="stat-card">
              <p className="text-sm text-slate-400">Štít týmu</p>
              <strong>{team.level}/5</strong>
              <p className="text-sm text-slate-300">{team.levelLabel}</p>
              <div className="progress-wrap">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${team.shieldScore}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1">Skóre štítu: {team.shieldScore}%</p>
              </div>
            </div>
            <div className="stat-card">
              <p className="text-sm text-slate-400">Dokončeno</p>
              <strong>{team.completed}</strong>
              <p className="text-sm text-slate-300">ze {team.sessions} pokusů</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-slate-400">Průměrné zlepšení</p>
              <strong>{Number(team.avgImprovement || 0).toFixed(1)}</strong>
              <p className="text-sm text-slate-300">body po post‑testu</p>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <img src="/images/ill-hero.svg" alt="Směna v bezpečí" />
          <div className="progress-pill mt-3">Doba: {course.duration} • 5 situací</div>
        </div>
      </section>

      <section className="card mt-4">
        <h2 className="text-2xl font-semibold">5 situací ze směny (rychlý náhled)</h2>
        <div className="module-grid mt-3">
          {modules.map((m, idx) => (
            <div className="module-card" key={m.slug}>
              <img src={m.image || '/images/ill-generic.svg'} alt={m.title} />
              <span className="chip">Kapitola {idx + 1}</span>
              <h3 className="text-lg font-semibold">{m.title}</h3>
              <p className="text-sm text-slate-300">
                {m.story.length > 120 ? `${m.story.slice(0, 120)}…` : m.story}
              </p>
              <Link className="btn btn-secondary btn-compact" href={`/kurz/${idx + 1}`}>
                Otevřít modul
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-4">
        <h2 className="text-2xl font-semibold mb-2">5 pravidel bezpečné směny</h2>
        <ul className="list-disc pl-6 space-y-1 text-slate-300">
          {course.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
    </>
  )
}
