'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function TopBar() {
  const [senior, setSenior] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('seniorMode') === 'on'
    setSenior(stored)
    document.body.classList.toggle('senior-mode', stored)
  }, [])

  const toggleSenior = () => {
    const next = !senior
    setSenior(next)
    document.body.classList.toggle('senior-mode', next)
    localStorage.setItem('seniorMode', next ? 'on' : 'off')
  }

  return (
    <header className="site-header">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 md:px-8">
        <Link href="/" className="brand">
          <img className="brand-logo" src="/images/jysk-logo.svg" alt="JYSK" />
          <span>JYSK CyberSafe</span>
        </Link>
        <button onClick={toggleSenior} className="btn btn-secondary btn-compact">
          Režim seniorní čtení
        </button>
      </div>
    </header>
  )
}
