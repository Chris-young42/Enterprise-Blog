import * as React from 'react'
import { cn } from '@/lib/cn'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'flex h-11 w-full rounded-xl border border-slate-300/80 bg-white/80 px-4 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition duration-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25 dark:border-slate-700/90 dark:bg-slate-950/75 dark:shadow-none',
        className,
      )}
      {...props}
    />
  )
}
