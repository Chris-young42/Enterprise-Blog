import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-slate-300/75 bg-white/82 px-3 py-1 text-xs font-medium tracking-wide text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700/85 dark:bg-slate-900/78 dark:text-slate-200',
        className,
      )}
      {...props}
    />
  )
}
