import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { useEffect } from 'react'
import { MOTION_DURATION, MOTION_EASE } from './motion-spec'

type MotionModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  footer?: ReactNode
}

export function MotionModal({
  open,
  onClose,
  title,
  description,
  footer,
  children,
}: PropsWithChildren<MotionModalProps>) {
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.overlay }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-md"
            onClick={onClose}
            aria-label="close modal"
          />
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: MOTION_DURATION.panel, ease: MOTION_EASE }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/30 bg-white/88 shadow-[0_40px_120px_rgba(2,6,23,0.35)] backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/88"
          >
            <header className="flex items-start justify-between border-b border-slate-200/70 px-6 py-5 dark:border-slate-800">
              <div className="min-w-0 space-y-1">
                {title ? <h3 className="text-lg font-semibold tracking-tight">{title}</h3> : null}
                {description ? <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                onClick={onClose}
                aria-label="close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="max-h-[65vh] overflow-y-auto px-6 py-5">{children}</div>
            {footer ? <footer className="border-t border-slate-200/70 px-6 py-4 dark:border-slate-800">{footer}</footer> : null}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
