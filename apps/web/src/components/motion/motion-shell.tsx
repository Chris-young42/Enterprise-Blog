import type { PropsWithChildren } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { MOTION_DURATION, MOTION_EASE } from './motion-spec'

export function PageMotion({ children }: PropsWithChildren) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 22, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
        transition={{
          duration: MOTION_DURATION.page,
          ease: MOTION_EASE,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export function HoverFloatCard({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.005 }}
      transition={{ type: 'spring', stiffness: 240, damping: 20, mass: 0.65 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerGroup({ children }: PropsWithChildren) {
  return (
    <motion.div
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.06,
          },
        },
      }}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
      }}
      transition={{ duration: MOTION_DURATION.item, ease: MOTION_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
