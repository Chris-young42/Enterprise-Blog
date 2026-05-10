import { AnimatePresence, motion } from 'framer-motion'
import type { PropsWithChildren, ReactNode } from 'react'
import { useEffect } from 'react'
import { MOTION_DURATION, MOTION_EASE } from './motion-spec'

type MotionDrawerProps = {
  open: boolean
  side?: 'left' | 'right'
  onClose: () => void
  header?: ReactNode
  footer?: ReactNode
}

export function MotionDrawer({
  open,
  side = 'right',
  onClose,
  header,
  footer,
  children,
}: PropsWithChildren<MotionDrawerProps>) {
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  const initialX = side === 'right' ? 28 : -28
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[115] flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.overlay }}
        >
          <button type="button" className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} aria-label="close drawer" />
          <motion.aside
            initial={{ x: initialX, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: initialX, opacity: 0 }}
            transition={{ duration: MOTION_DURATION.panel, ease: MOTION_EASE }}
            className={`relative z-10 ${side === 'right' ? 'ml-auto' : ''} flex h-full w-full max-w-md flex-col border-l border-white/30 bg-white/90 shadow-[0_20px_80px_rgba(2,6,23,0.28)] backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/90`}
          >
            {header ? <header className="border-b border-slate-200/70 px-5 py-4 dark:border-slate-800">{header}</header> : null}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer ? <footer className="border-t border-slate-200/70 px-5 py-4 dark:border-slate-800">{footer}</footer> : null}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
