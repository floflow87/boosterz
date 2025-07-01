import { animate, motion, useMotionValue, useTransform } from "framer-motion"
import { useEffect } from "react"

interface AnimatedCounterProps {
  targetValue: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({ targetValue, duration = 2, className = "" }: AnimatedCounterProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (value) => Math.round(value))

  useEffect(() => {
    // Ne pas animer si la valeur cible est 0
    if (targetValue === 0) {
      count.set(0)
      return
    }
    
    const controls = animate(count, targetValue, { 
      duration,
      ease: "easeOut"
    })
    return () => controls.stop()
  }, [count, targetValue, duration])

  return (
    <motion.span className={className}>
      {rounded}
    </motion.span>
  )
}