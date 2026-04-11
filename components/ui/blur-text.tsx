"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useInView, useAnimation, type Variant } from "framer-motion"

interface BlurTextProps {
  text: string
  delay?: number
  animateBy?: "words" | "letters"
  direction?: "top" | "bottom"
  className?: string
  stepDuration?: number
}

export function BlurText({
  text,
  delay = 100,
  animateBy = "words",
  direction = "top",
  className = "",
  stepDuration = 0.35,
}: BlurTextProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const controls = useAnimation()
  const [hasAnimated, setHasAnimated] = useState(false)

  const elements = animateBy === "words" ? text.split(" ") : text.split("")

  const variants: { hidden: Variant; visible: Variant } = {
    hidden: {
      opacity: 0,
      filter: "blur(10px)",
      y: direction === "top" ? -20 : 20,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
    },
  }

  useEffect(() => {
    if (isInView && !hasAnimated) {
      controls.start("visible")
      setHasAnimated(true)
    }
  }, [isInView, controls, hasAnimated])

  return (
    <div ref={ref} className={`flex flex-wrap justify-center gap-x-2 gap-y-1 ${className}`}>
      {elements.map((element, index) => (
        <motion.span
          key={index}
          custom={index}
          variants={variants}
          initial="hidden"
          animate={controls}
          transition={{
            duration: stepDuration,
            delay: (index * delay) / 1000,
            ease: [0.2, 0.65, 0.3, 0.9],
          }}
          className="inline-block"
        >
          {element}
          {animateBy === "words" && index < elements.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </div>
  )
}
