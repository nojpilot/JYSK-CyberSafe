'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { apiGet, apiPost } from '@/lib/api'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

type ResultData = {
  session: { pre_score: number; post_score: number; improvement: number }
  recommendations: string[]
  badges: { title: string; description: string; icon: string }[]
  team: { level: number; levelLabel: string; shieldScore: number }
  progress: { progress: number; stepIndex: number; totalSteps: number }
}

export default function ResultPage() {
  const [data, setData] = useState<ResultData | null>(null)
  const [feedback, setFeedback] = useState({ q1: '', q2: '', q3: '', q4: '', comment: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet<ResultData>('/api/result').then(setData).catch(() => {})
  }, [])

  if (!data) return <div className="card">Načítám…</div>

  const options = {
    q1: ['Velmi užitečný', 'Spíše užitečný', 'Spíše méně', 'Nepřínosný'],
    q2: ['Velmi srozumitelný', 'Spíše srozumitelný', 'Místy nejasný', 'Těžko srozumitelný'],
    q3: ['Velmi reálné', 'Spíše reálné', 'Spíše umělé', 'Nereálné'],
    q4: ['Klikací scénáře', 'Krátké moduly', 'Oboje', 'Nevyhovuje']
  }

  const canSubmit = feedback.q1 && feedback.q2 && feedback.q3 && feedback.q4

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit || saving || saved) return
    setSaving(true)
    setError('')
    try {
      await apiPost('/api/feedback', feedback)
      setSaved(true)
    } catch (err) {
      setError('Odeslání se nepovedlo. Zkus to prosím znovu.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <span className="kicker">Výsledek</span>
            <h1 className="text-3xl font-semibold">Hotovo. Tady je shrnutí.</h1>
            <p className="text-slate-300">Pre: {data.session.pre_score ?? 0} • Post: {data.session.post_score ?? 0} • Zlepšení: {data.session.improvement ?? 0}</p>
          </div>
          <div className="progress-pill">Krok {data.progress.stepIndex}/{data.progress.totalSteps}</div>
        </div>
        <div className="progress-wrap">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${data.progress.progress}%` }} />
          </div>
        </div>
      </section>

      <section className="card mt-4">
        <h2 className="text-2xl font-semibold">Doporučení</h2>
        <ul className="list-disc pl-6 text-slate-300 mt-2 space-y-1">
          {data.recommendations.length ? data.recommendations.map((r) => <li key={r}>{r}</li>) : <li>Skvělé. Žádná slabina.</li>}
        </ul>
      </section>

      <section className="card mt-4">
        <h2 className="text-2xl font-semibold">Odznaky</h2>
        <div className="badge-grid mt-3">
          {data.badges.length ? data.badges.map((b) => (
            <div className="badge-card" key={b.title}>
              <img src={b.icon} alt={b.title} />
              <strong>{b.title}</strong>
              <p className="text-sm text-slate-300">{b.description}</p>
            </div>
          )) : <p className="text-slate-300">Zatím žádný odznak.</p>}
        </div>
      </section>

      <section className="card mt-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Týmový štít</h2>
            <p className="text-slate-300">Level {data.team.level}/5 – {data.team.levelLabel}</p>
            <div className="progress-wrap">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${data.team.shieldScore}%` }} />
              </div>
            </div>
          </div>
          <LiquidButton href="/certifikat">Stáhnout certifikát</LiquidButton>
        </div>
      </section>

      <section className="card mt-4">
        <h2 className="text-2xl font-semibold">Krátký feedback (4 otázky)</h2>
        <p className="text-slate-300">Pomůže nám vyladit další směny. Trvá to 1 minutu.</p>
        <form className="survey mt-4" onSubmit={handleSubmit}>
          <div className="survey-block">
            <p className="survey-title">1. Jak užitečný byl kurz pro tvoji práci?</p>
            <div className="survey-options">
              {options.q1.map((o) => (
                <label key={o} className="survey-option">
                  <input type="radio" name="q1" value={o} checked={feedback.q1 === o} onChange={() => setFeedback((f) => ({ ...f, q1: o }))} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="survey-block">
            <p className="survey-title">2. Jak srozumitelný byl obsah?</p>
            <div className="survey-options">
              {options.q2.map((o) => (
                <label key={o} className="survey-option">
                  <input type="radio" name="q2" value={o} checked={feedback.q2 === o} onChange={() => setFeedback((f) => ({ ...f, q2: o }))} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="survey-block">
            <p className="survey-title">3. Jak reálné byly situace?</p>
            <div className="survey-options">
              {options.q3.map((o) => (
                <label key={o} className="survey-option">
                  <input type="radio" name="q3" value={o} checked={feedback.q3 === o} onChange={() => setFeedback((f) => ({ ...f, q3: o }))} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="survey-block">
            <p className="survey-title">4. Jaká forma učení ti sedí nejvíc?</p>
            <div className="survey-options">
              {options.q4.map((o) => (
                <label key={o} className="survey-option">
                  <input type="radio" name="q4" value={o} checked={feedback.q4 === o} onChange={() => setFeedback((f) => ({ ...f, q4: o }))} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="survey-block">
            <p className="survey-title">Dobrovolný komentář</p>
            <textarea
              name="comment"
              placeholder="Co bys zlepšil/a nebo doplnil/a?"
              value={feedback.comment}
              onChange={(e) => setFeedback((f) => ({ ...f, comment: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="survey-actions">
            <LiquidButton type="submit" disabled={!canSubmit || saving || saved}>
              {saving ? 'Odesílám…' : saved ? 'Děkujeme' : 'Odeslat feedback'}
            </LiquidButton>
            {error && <p className="text-sm text-red-300">{error}</p>}
            {saved && <p className="text-sm text-emerald-200">Feedback uložen. Díky!</p>}
          </div>
        </form>
      </section>
    </>
  )
}
