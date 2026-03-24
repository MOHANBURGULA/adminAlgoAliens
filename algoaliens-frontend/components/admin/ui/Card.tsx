import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type CardProps = {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export default function Card({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: CardProps) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(11,15,26,0.96))] p-5 shadow-[0_22px_50px_rgba(0,0,0,0.28)] sm:p-6",
        className,
      )}
    >
      {title || description || action ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-xl font-semibold text-white">{title}</h2> : null}
            {description ? <p className="mt-2 text-sm text-gray-400">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}

      <div className={cn(title || description || action ? "mt-6" : "", contentClassName)}>
        {children}
      </div>
    </section>
  )
}
