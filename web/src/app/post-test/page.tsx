'use client'

import { useEffect, useState } from 'react'
import RedFlagsGame, { GamePayload } from '@/components/game/RedFlagsGame'
import { apiGet } from '@/lib/api'

export default function PostTestPage() {
  const [game, setGame] = useState<GamePayload | null>(null)
  const [progress, setProgress] = useState<{ stepIndex: number; totalSteps: number; progress: number } | null>(null)

  useEffect(() => {
    apiGet<{ game: GamePayload; progress: { stepIndex: number; totalSteps: number; progress: number } }>('/api/game/post')
      .then((data) => {
        setGame(data.game)
        setProgress(data.progress)
      })
      .catch(() => {})
  }, [])

  if (!game || !progress) return <div className="card">Načítám…</div>

  return <RedFlagsGame game={game} progress={progress} phase="post" redirectTo="/vysledek" />
}
