'use client'

import * as React from 'react'
import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const liquidbuttonVariants = cva(
  'inline-flex items-center transition-colors justify-center cursor-pointer gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default: 'bg-transparent hover:scale-105 duration-300 transition text-white'
      },
      size: {
        default: 'h-12 px-8',
        sm: 'h-10 text-xs gap-1.5 px-6',
        lg: 'h-14 px-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

type LiquidButtonBaseProps = VariantProps<typeof liquidbuttonVariants> & {
  href?: string
  children?: React.ReactNode
  className?: string
}

type LiquidButtonLinkProps = LiquidButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'type' | 'href'> & {
    href: string
  }

type LiquidButtonButtonProps = LiquidButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined
  }

export type LiquidButtonProps = LiquidButtonLinkProps | LiquidButtonButtonProps

export function LiquidButton(props: LiquidButtonProps) {
  const { className, variant, size, href, children, ...rest } =
    props as LiquidButtonBaseProps & Record<string, unknown>
  const classNames = cn('relative', liquidbuttonVariants({ variant, size, className }))
  const content = (
    <>
      <div
        className="absolute inset-0 -z-10 rounded-full shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)] transition-all dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)]"
      />
      <div
        className="absolute inset-0 -z-20 h-full w-full overflow-hidden rounded-full"
        style={{ backdropFilter: 'url("#container-glass")' }}
      />
      <div className="pointer-events-none z-10">{children}</div>
      <GlassFilter />
    </>
  )

  if (href) {
    return (
      <Link href={href} className={classNames} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </Link>
    )
  }

  return (
    <button
      data-slot="button"
      className={classNames}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  )
}

function GlassFilter() {
  return (
    <svg className="hidden">
      <defs>
        <filter
          id="container-glass"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves="1"
            seed="1"
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="70"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}
