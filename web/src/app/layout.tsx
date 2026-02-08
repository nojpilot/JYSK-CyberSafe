import './globals.css'
import type { Metadata } from 'next'
import { DotScreenShader } from '@/components/ui/dot-shader-background'
import Header from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'JYSK CyberSafe',
  description: 'Mikro-kurz kyberbezpečnosti pro směnu v JYSKu'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className="dark">
      <body className="app-body dark-mode">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <DotScreenShader />
        </div>
        <div className="relative z-10">
          <Header />
          <main className="max-w-5xl mx-auto p-6 md:p-8">
            {children}
          </main>
        </div>
        <svg aria-hidden="true" className="glass-filter" focusable="false">
          <filter
            id="glass-distortion"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.001 0.005"
              numOctaves="1"
              seed="17"
              result="turbulence"
            />
            <feComponentTransfer in="turbulence" result="mapped">
              <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
              <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
              <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
            </feComponentTransfer>
            <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
            <feSpecularLighting
              in="softMap"
              surfaceScale="5"
              specularConstant="1"
              specularExponent="100"
              lightingColor="white"
              result="specLight"
            >
              <fePointLight x="-200" y="-200" z="300" />
            </feSpecularLighting>
            <feComposite
              in="specLight"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="litImage"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="softMap"
              scale="120"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      </body>
    </html>
  )
}
