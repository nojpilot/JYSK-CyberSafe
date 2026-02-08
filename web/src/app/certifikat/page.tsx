'use client'

import { useState } from 'react'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

export default function CertificatePage() {
  const [name, setName] = useState('')

  return (
    <section className="card space-y-4 max-w-xl mx-auto">
      <h1 className="text-3xl font-semibold">Certifikát</h1>
      <p className="text-slate-300">Zadej jméno nebo přezdívku. Uloží se jen do PDF.</p>
      <form action="/api/certificate" method="post" target="_blank" className="space-y-3">
        <input
          type="text"
          name="displayName"
          className="w-full"
          placeholder="Např. Jana K."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <LiquidButton type="submit">Stáhnout PDF</LiquidButton>
      </form>
    </section>
  )
}
