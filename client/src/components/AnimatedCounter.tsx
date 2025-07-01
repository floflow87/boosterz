import { animate, motion, useMotionValue, useTransform } from "framer-motion"
import { useEffect } from "react"

interface AnimatedCounterProps {
  targetValue: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({ targetValue, duration = 2, className = "" }: AnimatedCounterProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(() => Math.round(count.get()))

  useEffect(() => {
    const controls = animate(count, targetValue, { duration })
    return () => controls.stop()
  }, [count, targetValue, duration])

  return (
    <motion.span className={className}>
      {rounded}
    </motion.span>
  )
}