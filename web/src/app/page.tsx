'use client'

import { FormEvent, useMemo, useState } from 'react'
import scenarioData from '@/data/scenario.json'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { apiPost } from '@/lib/api'

type Option = {
  id: string
  text: string
  shortLabel?: string
  isCorrect: boolean
  feedback: string
}

type RedFlagTaskField = {
  text: string
  optionId?: string
}

type RedFlagTaskLine = {
  id: string
  text: string
  optionId?: string
  variant?: 'text' | 'link' | 'attachment'
}

type Challenge = {
  question: string
  type: 'binary_choice' | 'multiple_choice' | 'hotspot' | 'red_flags'
  options: Option[]
  redFlagTask?: {
    intro: string
    hint: string
    targetCount: number
    header: {
      from: RedFlagTaskField
      subject: RedFlagTaskField
      to: RedFlagTaskField
    }
    bodyLines: RedFlagTaskLine[]
  }
}

type Room = {
  id: string
  time: string
  location: string
  storyIntro: string
  learningPoint: string
  challenge: Challenge
}

type SurveyQuestion = {
  id: 'q1' | 'q2' | 'q3' | 'q4'
  label: string
  options: string[]
}

type SurveyPayload = {
  q1: string
  q2: string
  q3: string
  q4: string
  comment: string
}

type AnswerRecord = {
  roomId: string
  optionId: string
  isCorrect: boolean
}

type RedFlagsResult = {
  isCorrect: boolean
  feedback: string
}

type ViewState = 'intro' | 'shift' | 'summary'

const typedData = scenarioData as {
  meta: { title: string; subtitle: string; description: string }
  shiftTimeline: Room[]
  survey: { title: string; subtitle: string; questions: SurveyQuestion[] }
}

const HABITS = [
  'U zpráv a e-mailů nejdřív ověřuj, potom jednej.',
  'Používej dlouhou heslovou frázi z více běžných slov.',
  'Když někdo tlačí na čas, zastav se a ověř si to jinou cestou.',
  'Počítač zamykej i při krátkém odchodu od místa.'
]

const createEmptySurvey = (): SurveyPayload => ({
  q1: '',
  q2: '',
  q3: '',
  q4: '',
  comment: ''
})

export default function HomePage() {
  const rooms = typedData.shiftTimeline
  const surveyQuestions = typedData.survey.questions

  const [view, setView] = useState<ViewState>('intro')
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<Option | null>(null)
  const [redFlagHits, setRedFlagHits] = useState<string[]>([])
  const [redFlagMisses, setRedFlagMisses] = useState<string[]>([])
  const [redFlagResult, setRedFlagResult] = useState<RedFlagsResult | null>(null)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [survey, setSurvey] = useState<SurveyPayload>(createEmptySurvey())
  const [savingSurvey, setSavingSurvey] = useState(false)
  const [surveySaved, setSurveySaved] = useState(false)
  const [surveyError, setSurveyError] = useState('')

  const currentRoom = rooms[currentRoomIndex]
  const correctAnswers = useMemo(() => answers.filter((a) => a.isCorrect).length, [answers])
  const scorePercent = useMemo(
    () => (rooms.length > 0 ? Math.round((correctAnswers / rooms.length) * 100) : 0),
    [correctAnswers, rooms.length]
  )
  const progressPercent = useMemo(
    () => Math.round((currentRoomIndex / rooms.length) * 100),
    [currentRoomIndex, rooms.length]
  )

  const canSubmitSurvey = survey.q1 && survey.q2 && survey.q3 && survey.q4

  const startShift = () => {
    setView('shift')
    setCurrentRoomIndex(0)
    setSelectedOption(null)
    setRedFlagHits([])
    setRedFlagMisses([])
    setRedFlagResult(null)
    setAnswers([])
    setSurvey(createEmptySurvey())
    setSurveySaved(false)
    setSurveyError('')
  }

  const chooseOption = (option: Option) => {
    if (selectedOption || currentRoom.challenge.type === 'red_flags') return
    setSelectedOption(option)
    setAnswers((prev) => [
      ...prev,
      {
        roomId: currentRoom.id,
        optionId: option.id,
        isCorrect: option.isCorrect
      }
    ])
  }

  const markRedFlag = (optionId: string) => {
    if (!currentRoom || currentRoom.challenge.type !== 'red_flags' || redFlagResult) return
    if (redFlagHits.includes(optionId) || redFlagMisses.includes(optionId)) return

    const option = currentRoom.challenge.options.find((candidate) => candidate.id === optionId)
    if (!option) return

    if (option.isCorrect) {
      setRedFlagHits((prev) => [...prev, optionId])
      return
    }

    setRedFlagMisses((prev) => [...prev, optionId])
  }

  const evaluateRedFlags = () => {
    if (!currentRoom || currentRoom.challenge.type !== 'red_flags' || redFlagResult) return

    const options = currentRoom.challenge.options
    const missing = options.filter((option) => option.isCorrect && !redFlagHits.includes(option.id))
    const wrong = options.filter((option) => !option.isCorrect && redFlagMisses.includes(option.id))
    const isCorrect = missing.length === 0 && wrong.length === 0

    let feedback = ''
    if (isCorrect) {
      feedback =
        'Skvělá práce. Našel/a jsi všechny varovné signály a nic navíc. Přesně takto se dá zastavit podvodný e-mail ještě před škodou.'
    } else {
      const parts: string[] = []
      if (missing.length > 0) {
        const missingLabels = missing.map((option) => option.shortLabel ?? option.text).join(', ')
        parts.push(`Ještě chybělo označit: ${missingLabels}.`)
      }
      if (wrong.length > 0) {
        const wrongLabels = wrong.map((option) => option.shortLabel ?? option.text).join(', ')
        parts.push(`Označil/a jsi i položku, která sama o sobě není varování: ${wrongLabels}.`)
      }
      parts.push(
        'U podobné zprávy neotevírej přílohu, neklikej na odkaz a požadavek vždy ověř s vedoucím.'
      )
      feedback = parts.join(' ')
    }

    setRedFlagResult({ isCorrect, feedback })
    setAnswers((prev) => [
      ...prev,
      {
        roomId: currentRoom.id,
        optionId: isCorrect ? 'red_flags_ok' : 'red_flags_retry',
        isCorrect
      }
    ])
  }

  const goNextRoom = () => {
    if (!selectedOption && !redFlagResult) return
    if (currentRoomIndex >= rooms.length - 1) {
      setView('summary')
      return
    }

    setCurrentRoomIndex((prev) => prev + 1)
    setSelectedOption(null)
    setRedFlagHits([])
    setRedFlagMisses([])
    setRedFlagResult(null)
  }

  const submitSurvey = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmitSurvey || savingSurvey || surveySaved) return

    setSavingSurvey(true)
    setSurveyError('')
    try {
      await apiPost('/api/feedback', survey)
      setSurveySaved(true)
    } catch (err) {
      setSurveyError('Odeslání se nepovedlo. Zkus to prosím znovu.')
    } finally {
      setSavingSurvey(false)
    }
  }

  if (view === 'intro') {
    return (
      <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_35%,rgba(255,255,255,0.08)_0,rgba(255,255,255,0)_35%),radial-gradient(rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:100%_100%,24px_24px] opacity-45" />

        <div className="relative z-10">
          <section className="card hero">
            <div className="space-y-4">
              <span className="kicker">Mikro-kurz pro směnu</span>
              <h1 className="text-4xl font-semibold">{typedData.meta.title}</h1>
              <p className="text-lg text-slate-300">{typedData.meta.subtitle}</p>
              <p className="text-sm text-slate-400">{typedData.meta.description}</p>
              <div className="flex flex-wrap gap-3 items-center">
                <LiquidButton type="button" onClick={startShift}>
                  Začít virtuální směnu
                </LiquidButton>
              </div>
              <div className="stat-grid">
                <div className="stat-card">
                  <p className="text-sm text-slate-400">Počet situací</p>
                  <strong>{rooms.length}</strong>
                  <p className="text-sm text-slate-300">Jedna směna od rána do večera</p>
                </div>
                <div className="stat-card">
                  <p className="text-sm text-slate-400">Délka</p>
                  <strong>7-10 min</strong>
                  <p className="text-sm text-slate-300">Krátké kroky bez stresu</p>
                </div>
                <div className="stat-card">
                  <p className="text-sm text-slate-400">Styl učení</p>
                  <strong>Hned v praxi</strong>
                  <p className="text-sm text-slate-300">Po každé volbě hned vysvětlení</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (view === 'shift' && currentRoom) {
    const isRedFlagsChallenge = currentRoom.challenge.type === 'red_flags'
    const redFlagTask = isRedFlagsChallenge ? currentRoom.challenge.redFlagTask : undefined
    const redFlagTargetCount =
      redFlagTask?.targetCount ?? currentRoom.challenge.options.filter((option) => option.isCorrect).length
    const canEvaluateRedFlags =
      isRedFlagsChallenge &&
      !redFlagResult &&
      redFlagHits.length + redFlagMisses.length > 0
    const activeResult = selectedOption
      ? { isCorrect: selectedOption.isCorrect, feedback: selectedOption.feedback }
      : redFlagResult

    const renderMarkableText = (
      text: string,
      optionId?: string,
      variant: 'text' | 'link' | 'attachment' = 'text'
    ) => {
      const variantClasses =
        variant === 'link'
          ? 'text-blue-300 break-all'
          : variant === 'attachment'
            ? 'inline-flex mt-2 rounded-xl border border-white/20 px-3 py-2 font-mono text-base break-all'
            : 'text-slate-100'

      if (!optionId || !isRedFlagsChallenge) {
        return <span className={variantClasses}>{text}</span>
      }

      const option = currentRoom.challenge.options.find((item) => item.id === optionId)
      const isHit = redFlagHits.includes(optionId)
      const isMiss = redFlagMisses.includes(optionId)

      let markerClasses = 'bg-transparent'
      if (isHit) markerClasses = 'bg-emerald-500/20 ring-1 ring-emerald-300/80'
      if (isMiss) markerClasses = 'bg-amber-500/16 ring-1 ring-amber-300/80'
      if (!isHit && !isMiss && option?.isCorrect) markerClasses = 'hover:bg-white/10 hover:ring-1 hover:ring-white/30'
      if (!isHit && !isMiss && option && !option.isCorrect) markerClasses = 'hover:bg-white/6'

      const buttonClasses =
        variant === 'attachment'
          ? `${variantClasses} rounded-xl text-left transition ${markerClasses}`
          : `${variantClasses} rounded-md px-1 py-0.5 text-left transition ${markerClasses}`

      return (
        <button
          type="button"
          onClick={() => markRedFlag(optionId)}
          disabled={Boolean(redFlagResult)}
          className={buttonClasses}
        >
          {text}
        </button>
      )
    }

    return (
      <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
        <div className="relative z-10 space-y-4">
          <section className="card space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <span className="kicker">{`${currentRoom.time} • Situace ${currentRoomIndex + 1}/${rooms.length}`}</span>
                <h1 className="text-3xl font-semibold">{currentRoom.location}</h1>
              </div>
              <div className="progress-pill">Průběh směny: {progressPercent}%</div>
            </div>
            <div className="progress-wrap">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </section>

          <section className="card space-y-4">
            <h2 className="text-2xl font-semibold">Co se právě děje</h2>
            <p className="text-lg text-slate-200">{currentRoom.storyIntro}</p>
            <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-3">
              <p className="text-sm text-blue-100">{currentRoom.learningPoint}</p>
            </div>
          </section>

          <section className="card space-y-4">
            <h2 className="text-2xl font-semibold">{currentRoom.challenge.question}</h2>
            {isRedFlagsChallenge && redFlagTask ? (
              <div className="game-panel email">
                <p className="text-slate-200">{redFlagTask.intro}</p>
                <p className="text-slate-300 mt-1">
                  Nalezeno <strong>{redFlagHits.length}</strong> z <strong>{redFlagTargetCount}</strong> podezřelých
                  bodů.
                </p>
                <p className="text-slate-400 text-sm mt-1">{redFlagTask.hint}</p>

                <div className="email-header mt-4">
                  <div>
                    <strong>Od:</strong>
                    <span className="email-from">
                      {renderMarkableText(redFlagTask.header.from.text, redFlagTask.header.from.optionId)}
                    </span>
                  </div>
                  <div>
                    <strong>Předmět:</strong>
                    <span className="email-subject">
                      {renderMarkableText(redFlagTask.header.subject.text, redFlagTask.header.subject.optionId)}
                    </span>
                  </div>
                  <div>
                    <strong>Komu:</strong>
                    <span className="email-to">
                      {renderMarkableText(redFlagTask.header.to.text, redFlagTask.header.to.optionId)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-slate-100">
                  {redFlagTask.bodyLines.map((line) => (
                    <p key={line.id} className="leading-relaxed">
                      {renderMarkableText(line.text, line.optionId, line.variant)}
                    </p>
                  ))}
                </div>

                {redFlagMisses.length > 0 && !redFlagResult && (
                  <p className="text-sm text-amber-200 mt-2">
                    Máš označené i body, které nejsou samy o sobě varování. Ještě si e-mail projdi.
                  </p>
                )}

                {!redFlagResult && (
                  <div className="mt-4">
                    <LiquidButton
                      type="button"
                      onClick={evaluateRedFlags}
                      disabled={!canEvaluateRedFlags}
                    >
                      Vyhodnotit označené body
                    </LiquidButton>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {currentRoom.challenge.options.map((option) => {
                  const isSelected = selectedOption?.id === option.id
                  const selectedTone = isSelected
                    ? selectedOption?.isCorrect
                      ? '!ring-2 !ring-emerald-300/85 !border-emerald-300/80 !bg-emerald-500/16'
                      : '!ring-2 !ring-amber-300/85 !border-amber-300/80 !bg-amber-500/16'
                    : ''
                  return (
                    <LiquidButton
                      key={option.id}
                      type="button"
                      onClick={() => chooseOption(option)}
                      disabled={Boolean(selectedOption)}
                      className={`w-full !min-w-0 justify-start text-left !h-auto !rounded-2xl !px-5 !py-4 !whitespace-normal [&>div.pointer-events-none]:!w-full [&>div.pointer-events-none]:!min-w-0 ${
                        selectedTone
                      }`}
                    >
                      <span className="block w-full min-w-0 break-words [overflow-wrap:anywhere] leading-snug">
                        {option.text}
                      </span>
                    </LiquidButton>
                  )
                })}
              </div>
            )}

            {activeResult && (
              <div
                className={`rounded-2xl border-2 p-4 ${
                  activeResult.isCorrect
                    ? 'border-emerald-300/85 bg-emerald-500/18 shadow-[0_0_0_1px_rgba(16,185,129,0.45),0_0_26px_rgba(16,185,129,0.18)]'
                    : 'border-amber-300/85 bg-amber-400/16 shadow-[0_0_0_1px_rgba(252,211,77,0.45),0_0_26px_rgba(251,191,36,0.18)]'
                }`}
              >
                <h3 className={`text-lg font-semibold mb-1 ${activeResult.isCorrect ? 'text-emerald-100' : 'text-amber-100'}`}>
                  {activeResult.isCorrect ? 'Skvělá volba' : 'Dobrý pokus'}
                </h3>
                <p className="text-slate-100">{activeResult.feedback}</p>
                <div className="mt-4">
                  <LiquidButton type="button" onClick={goNextRoom}>
                    {currentRoomIndex === rooms.length - 1 ? 'Zobrazit shrnutí' : 'Pokračovat na další situaci'}
                  </LiquidButton>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
      <div className="relative z-10 space-y-4">
        <section className="card hero">
          <div className="space-y-4">
            <span className="kicker">Shrnutí směny</span>
            <h1 className="text-4xl font-semibold">Směna dokončena</h1>
            <p className="text-lg text-slate-300">
              Zvládl/a jsi {correctAnswers} z {rooms.length} situací správně.
            </p>
            <div className="progress-wrap">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${scorePercent}%` }} />
              </div>
              <p className="text-sm text-slate-300 mt-2">Skóre bezpečných návyků: {scorePercent}%</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LiquidButton type="button" onClick={startShift}>
                Spustit směnu znovu
              </LiquidButton>
            </div>
          </div>
          <div className="hero-visual">
            <h2 className="text-xl font-semibold">Co si odnést do praxe</h2>
            <ul className="list-disc pl-6 mt-3 text-slate-200/90 space-y-2">
              {HABITS.map((habit) => (
                <li key={habit}>{habit}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card">
          <h2 className="text-2xl font-semibold">{typedData.survey.title}</h2>
          <p className="text-slate-300 mt-1">{typedData.survey.subtitle}</p>

          <form className="survey mt-4" onSubmit={submitSurvey}>
            {surveyQuestions.map((question) => (
              <div className="survey-block" key={question.id}>
                <p className="survey-title">{question.label}</p>
                <div className="survey-options">
                  {question.options.map((option) => (
                    <label key={option} className="survey-option">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={survey[question.id] === option}
                        onChange={() => setSurvey((prev) => ({ ...prev, [question.id]: option }))}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="survey-block">
              <p className="survey-title">Dobrovolný komentář</p>
              <textarea
                name="comment"
                rows={3}
                placeholder="Co by příště pomohlo ještě víc?"
                value={survey.comment}
                onChange={(e) => setSurvey((prev) => ({ ...prev, comment: e.target.value }))}
              />
            </div>

            <div className="survey-actions">
              <LiquidButton type="submit" disabled={!canSubmitSurvey || savingSurvey || surveySaved}>
                {savingSurvey ? 'Odesílám...' : surveySaved ? 'Děkujeme za zpětnou vazbu' : 'Odeslat anketu'}
              </LiquidButton>
              {surveyError && <p className="text-sm text-red-300">{surveyError}</p>}
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
