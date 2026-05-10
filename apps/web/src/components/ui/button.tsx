import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium tracking-wide transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        default:
          'border border-slate-800 bg-slate-950 text-white shadow-[0_20px_50px_rgba(2,6,23,0.35)] hover:-translate-y-0.5 hover:bg-slate-900 dark:border-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100',
        secondary:
          'border border-slate-200/90 bg-white/85 text-slate-900 shadow-[0_10px_34px_rgba(15,23,42,0.08)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800',
        ghost: 'bg-transparent text-slate-700 hover:bg-white/70 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800/75 dark:hover:text-white',
        outline:
          'border border-slate-300/90 bg-white/75 text-slate-900 shadow-[0_8px_28px_rgba(15,23,42,0.08)] backdrop-blur-md hover:-translate-y-0.5 hover:border-slate-500 hover:bg-white dark:border-slate-700 dark:bg-slate-950/75 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-900',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-6 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}
