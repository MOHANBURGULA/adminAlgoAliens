"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

type BrandLogoProps = {
  className?: string
  href?: string
  priority?: boolean
  showSubtitle?: boolean
  showWordmark?: boolean
  size?: number
  subtitle?: string
  titleClassName?: string
}

function BrandLogoContent({
  className,
  priority = false,
  showSubtitle = false,
  showWordmark = true,
  size = 48,
  subtitle = "Learner area",
  titleClassName,
}: Omit<BrandLogoProps, "href">) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="brand-logo-shell shrink-0"
        style={{
          height: `${size}px`,
          width: `${size}px`,
        }}
      >
        <Image
          src="/algoaliens-official-logo.jpeg"
          alt="AlgoAliens official logo"
          fill
          priority={priority}
          className="brand-logo-image"
          sizes={`${size}px`}
        />
      </div>

      {showWordmark ? (
        <div className="min-w-0">
          {showSubtitle ? (
            <p className="text-xs uppercase tracking-[0.24em] text-theme-muted">{subtitle}</p>
          ) : null}
          <p className={cn("text-lg font-semibold leading-none text-theme-main", titleClassName)}>
            AlgoAliens
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default function BrandLogo({ href = "/", ...props }: BrandLogoProps) {
  if (!href) {
    return <BrandLogoContent {...props} />
  }

  return (
    <Link href={href} className="inline-flex">
      <BrandLogoContent {...props} />
    </Link>
  )
}
