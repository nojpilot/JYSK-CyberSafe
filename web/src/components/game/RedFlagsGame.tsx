'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GameResults } from '@/lib/api'
import { apiPost } from '@/lib/api'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

export type GameLine = {
  text: string
  flag?: boolean
  safe?: boolean
  link?: boolean
  attachment?: boolean
}

export type GameScene = {
  id: string
  kind: 'email' | 'chat' | 'note' | 'screen' | 'privacy'
  topic: string
  title: string
  lead: string
  hint?: string
  header?: { from?: string; subject?: string; to?: string; app?: string; name?: string }
  headerFlags?: { from?: 'flag' | 'safe'; subject?: 'flag' | 'safe'; to?: 'flag' | 'safe' }
  lines: GameLine[]
}

export type GamePayload = {
  title: string
  intro?: string
  scenes: GameScene[]
}

type Props = {
  game: GamePayload
  progress?: { stepIndex: number; totalSteps: number; progress: number }
  phase: 'pre' | 'post'
  redirectTo: string
  mode?: 'default' | 'onboarding'
}

export default function RedFlagsGame({ game, progress, phase, redirectTo, mode = 'default' }: Props) {
  const router = useRouter()
  const scenes = game?.scenes || []

  const topicTotals = useMemo(() => {
    const totals: Record<string, { found: number; total: number }> = {}
    scenes.forEach((scene) => {
      const count = scene.lines.filter((l) => l.flag).length
      const headerCount = Object.values(scene.headerFlags || {}).filter((v) => v === 'flag').length
      const tag = scene.topic || 'general'
      if (!totals[tag]) totals[tag] = { found: 0, total: 0 }
      totals[tag].total += count + headerCount
    })
    return totals
  }, [scenes])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [miss, setMiss] = useState(0)
  const [foundTotal, setFoundTotal] = useState(0)
  const [feedback, setFeedback] = useState<{ type: 'good' | 'bad'; text: string } | null>(null)
  const [sceneFound, setSceneFound] = useState<Record<number, Set<string>>>({})
  const [missFlash, setMissFlash] = useState<Record<string, boolean>>({})

  const currentScene = scenes[currentIndex]
  const flagsInScene =
    (currentScene?.lines.filter((l) => l.flag).length || 0) +
    Object.values(currentScene?.headerFlags || {}).filter((v) => v === 'flag').length
  const foundInScene = sceneFound[currentIndex]?.size || 0
  const sceneComplete = flagsInScene > 0 && foundInScene >= flagsInScene

  const setFound = (sceneIdx: number, key: string, topic: string) => {
    setSceneFound((prev) => {
      const next = { ...prev }
      const set = new Set(next[sceneIdx] || [])
      if (!set.has(key)) {
        set.add(key)
        next[sceneIdx] = set
        setFoundTotal((v) => v + 1)
        topicTotals[topic].found += 1
      }
      return next
    })
  }

  const markMiss = (sceneIdx: number, key: string) => {
    const missKey = `${sceneIdx}-${key}`
    setMissFlash((prev) => ({ ...prev, [missKey]: true }))
    window.setTimeout(() => {
      setMissFlash((prev) => {
        const next = { ...prev }
        delete next[missKey]
        return next
      })
    }, 600)
  }

  const handleFlagClick = (sceneIdx: number, key: string, topic: string) => {
    if (sceneFound[sceneIdx]?.has(key)) return
    setFound(sceneIdx, key, topic)
    setFeedback({ type: 'good', text: 'Správně: tohle je podezřelé.' })
  }

  const handleSafeClick = (sceneIdx: number, key: string) => {
    if (mode === 'onboarding') {
      markMiss(sceneIdx, key)
      setFeedback({ type: 'bad', text: 'Tohle je bezpečné. V rozjezdu nepočítáme omyly.' })
      return
    }
    setMiss((v) => v + 1)
    markMiss(sceneIdx, key)
    setFeedback({ type: 'bad', text: 'Tohle je bezpečné. Neklikej sem.' })
  }

  const finalize = async () => {
    if (mode === 'onboarding') {
      router.push(redirectTo)
      return
    }
    const payload: GameResults = {
      score: foundTotal,
      max: Object.values(topicTotals).reduce((acc, t) => acc + t.total, 0),
      miss,
      topics: topicTotals
    }

    await apiPost(`/api/game/${phase}`, payload)
    router.push(redirectTo)
  }

  if (!currentScene) {
    return null
  }

  return (
    <form className="space-y-4">
      <section className="card space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <span className="kicker">Hra</span>
            <h1 className="text-3xl font-semibold">{game.title}</h1>
            <p className="text-slate-300">{game.intro || 'Klikni na podezřelé části v krátkých situacích.'}</p>
          </div>
          {progress && (
            <div className="progress-pill">
              Krok {progress.stepIndex}/{progress.totalSteps}
            </div>
          )}
        </div>
        {progress && (
          <div className="progress-wrap">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress.progress}%` }} />
            </div>
          </div>
        )}
          <div className="game-rules">
            {mode === 'onboarding' ? (
              <>
                <strong>Rozjezd:</strong> Zkus si mechaniku. Klikni na podezřelé části.
                Bezpečné části neklikej. Omyl se v rozjezdu nepočítá.
              </>
            ) : (
              <>
                <strong>Úkol:</strong> V každé situaci klikni na všechny podezřelé části.
                Bezpečné části neklikej. Další situace se odemkne až po nalezení všech vlajek.
              </>
            )}
          </div>
          <div className="game-status">
            <div className="chip">Situace: {currentIndex + 1}/{scenes.length}</div>
            <div className="chip">Nalezeno v této situaci: {foundInScene}/{flagsInScene}</div>
            {mode === 'onboarding' ? (
              <div className="chip">Rozjezd bez skóre</div>
            ) : (
              <div className="chip">Omyl: {miss}</div>
            )}
          </div>
        {feedback && (
          <div className={`game-feedback ${feedback.type === 'good' ? 'is-good' : 'is-bad'}`}>
            {feedback.text}
          </div>
        )}
      </section>

      <section className="card game-scene">
        <div className="space-y-2">
          <span className="kicker">Situace</span>
          <h2 className="text-2xl font-semibold">{currentScene.title}</h2>
          <p className="text-slate-300">{currentScene.lead}</p>
          <p className="text-sm text-slate-400">
            Najdi <strong>{flagsInScene}</strong> podezřelých věcí.
          </p>
          {currentScene.hint && (
            <p className="text-sm text-slate-400"><strong>Nápověda:</strong> {currentScene.hint}</p>
          )}
        </div>

        {currentScene.kind === 'email' && (
          <div className="game-panel email">
            <div className="email-header">
              {(['from', 'subject', 'to'] as const).map((field) => {
                const value = currentScene.header?.[field]
                if (!value) return null
                const state = currentScene.headerFlags?.[field]
                const key = `header-${field}`
                const isFound = sceneFound[currentIndex]?.has(key)
                const missKey = `${currentIndex}-${key}`
                const className = state === 'flag'
                  ? `flag ${isFound ? 'found' : ''}`
                  : state === 'safe'
                    ? `safe ${missFlash[missKey] ? 'miss' : ''}`
                    : ''
                const onClick = state
                  ? () => (state === 'flag'
                    ? handleFlagClick(currentIndex, key, currentScene.topic)
                    : handleSafeClick(currentIndex, key))
                  : undefined

                const label = field === 'from' ? 'Od:' : field === 'subject' ? 'Předmět:' : 'Komu:'
                const valueClass = field === 'from' ? 'email-from' : field === 'subject' ? 'email-subject' : 'email-to'

                return (
                  <div key={field} onClick={onClick} className={className}>
                    <strong>{label}</strong> <span className={valueClass}>{value}</span>
                  </div>
                )
              })}
            </div>
            <div className="space-y-2">
              {currentScene.lines.map((line, idx) => {
                const key = `line-${idx}`
                const isFound = sceneFound[currentIndex]?.has(key)
                const missKey = `${currentIndex}-${key}`
                const className = line.flag
                  ? `flag ${isFound ? 'found' : ''}`
                  : line.safe
                    ? `safe ${missFlash[missKey] ? 'miss' : ''}`
                    : ''

                if (line.attachment) {
                  return (
                    <div
                      key={idx}
                      className={`attachment-chip ${className}`}
                      onClick={() =>
                        line.flag
                          ? handleFlagClick(currentIndex, key, currentScene.topic)
                          : line.safe
                            ? handleSafeClick(currentIndex, key)
                            : null
                      }
                    >
                      <span className="attachment-label">Příloha</span>
                      <span className="attachment-name">{line.text}</span>
                    </div>
                  )
                }

                if (line.link) {
                  return (
                    <p key={idx}>
                      <a
                        className={className}
                        onClick={() =>
                          line.flag
                            ? handleFlagClick(currentIndex, key, currentScene.topic)
                            : line.safe
                              ? handleSafeClick(currentIndex, key)
                              : null
                        }
                      >
                        {line.text}
                      </a>
                    </p>
                  )
                }

                return (
                  <p
                    key={idx}
                    className={className}
                    onClick={() =>
                      line.flag
                        ? handleFlagClick(currentIndex, key, currentScene.topic)
                        : line.safe
                          ? handleSafeClick(currentIndex, key)
                          : null
                    }
                  >
                    {line.text}
                  </p>
                )
              })}
            </div>
          </div>
        )}

        {currentScene.kind === 'chat' && (
          <div className="game-panel chat">
            <div className="chat-header">
              <strong>{currentScene.header?.app}</strong> • {currentScene.header?.name} • {currentScene.header?.from}
            </div>
            <div className="chat-body">
              {currentScene.lines.map((line, idx) => {
                const key = `line-${idx}`
                const isFoundLine = sceneFound[currentIndex]?.has(key)
                const missKey = `${currentIndex}-${key}`
                const className = line.flag
                  ? `chat-bubble flag ${isFoundLine ? 'found' : ''}`
                  : line.safe
                    ? `chat-bubble safe ${missFlash[missKey] ? 'miss' : ''}`
                    : 'chat-bubble'

                return (
                  <div
                    key={idx}
                    className={className}
                    onClick={() =>
                      line.flag
                        ? handleFlagClick(currentIndex, key, currentScene.topic)
                        : line.safe
                          ? handleSafeClick(currentIndex, key)
                          : null
                    }
                  >
                    {line.text}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {currentScene.kind !== 'email' && currentScene.kind !== 'chat' && (
          <div className={`game-panel ${currentScene.kind}`}>
            <ul className="scene-list">
              {currentScene.lines.map((line, idx) => {
                const key = `line-${idx}`
                const isFound = sceneFound[currentIndex]?.has(key)
                const missKey = `${currentIndex}-${key}`
                const className = line.flag
                  ? `flag ${isFound ? 'found' : ''}`
                  : line.safe
                    ? `safe ${missFlash[missKey] ? 'miss' : ''}`
                    : ''

                return (
                  <li
                    key={idx}
                    className={className}
                    onClick={() =>
                      line.flag
                        ? handleFlagClick(currentIndex, key, currentScene.topic)
                        : line.safe
                          ? handleSafeClick(currentIndex, key)
                          : null
                    }
                  >
                    {line.text}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>

      <div className="flex gap-3 flex-wrap">
        {currentIndex > 0 && (
          <button type="button" className="btn btn-tertiary" onClick={() => setCurrentIndex((v) => v - 1)}>
            Zpět
          </button>
        )}
        {currentIndex < scenes.length - 1 && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!sceneComplete}
            onClick={() => sceneComplete && setCurrentIndex((v) => v + 1)}
          >
            Další situace
          </button>
        )}
        {currentIndex === scenes.length - 1 && (
          <LiquidButton type="button" disabled={!sceneComplete} onClick={finalize}>
            {mode === 'onboarding' ? 'Pokračovat do kurzu' : 'Dokončit hru'}
          </LiquidButton>
        )}
      </div>
    </form>
  )
}
