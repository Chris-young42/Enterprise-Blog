import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ToastContext, type ToastTone } from './use-toast'
import { MOTION_DURATION, MOTION_EASE } from '@/components/motion/motion-spec'

type ToastItem = {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const showToast = useCallback((input: { title: string; description?: string; tone?: ToastTone }) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const tone = input.tone ?? 'info'
    setToasts((prev) => {
      const next = {
        id,
        title: input.title,
        tone,
        ...(input.description ? { description: input.description } : {}),
      }
      return [next, ...prev].slice(0, 4)
    })
    window.setTimeout(() => dismiss(id), 3600)
  }, [dismiss])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[130] flex w-[min(92vw,420px)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((item) => {
            const Icon = item.tone === 'success' ? CheckCircle2 : item.tone === 'error' ? CircleAlert : Info
            const toneClass =
              item.tone === 'success'
                ? 'border-emerald-300/70 bg-emerald-50/90 text-emerald-900 dark:border-emerald-700/70 dark:bg-emerald-950/70 dark:text-emerald-100'
                : item.tone === 'error'
                  ? 'border-rose-300/70 bg-rose-50/90 text-rose-900 dark:border-rose-700/70 dark:bg-rose-950/70 dark:text-rose-100'
                  : 'border-slate-300/70 bg-white/90 text-slate-900 dark:border-slate-700/70 dark:bg-slate-950/85 dark:text-slate-100'

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: MOTION_DURATION.toast, ease: MOTION_EASE }}
                className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_20px_60px_rgba(2,6,23,0.25)] backdrop-blur-xl ${toneClass}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.title}</p>
                    {item.description ? <p className="mt-0.5 text-xs opacity-85">{item.description}</p> : null}
                  </div>
                  <button
                    type="button"
                    className="rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                    onClick={() => dismiss(item.id)}
                    aria-label="dismiss toast"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
