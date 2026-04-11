"use client"

import { motion } from "framer-motion"

interface IslamicPatternProps {
  className?: string
  animate?: boolean
}

export function IslamicPattern({ className = "", animate = true }: IslamicPatternProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg 
        className="w-full h-full opacity-[0.04]" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern 
            id="islamic-geometric" 
            width="80" 
            height="80" 
            patternUnits="userSpaceOnUse"
          >
            {/* 8-pointed star pattern */}
            <g fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground">
              {/* Central star */}
              <polygon points="40,10 45,25 60,25 48,35 53,50 40,40 27,50 32,35 20,25 35,25" />
              {/* Connecting lines */}
              <line x1="0" y1="40" x2="20" y2="40" />
              <line x1="60" y1="40" x2="80" y2="40" />
              <line x1="40" y1="0" x2="40" y2="10" />
              <line x1="40" y1="50" x2="40" y2="80" />
              {/* Corner decorations */}
              <circle cx="0" cy="0" r="5" />
              <circle cx="80" cy="0" r="5" />
              <circle cx="0" cy="80" r="5" />
              <circle cx="80" cy="80" r="5" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-geometric)" />
      </svg>
      
      {animate && (
        <>
          {/* Floating geometric shapes */}
          <motion.div
            className="absolute top-1/4 right-10 w-16 h-16 border border-primary/10 rotate-45"
            animate={{ 
              y: [0, -20, 0],
              rotate: [45, 90, 45],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/3 left-20 w-12 h-12 border border-accent/10 rotate-12"
            animate={{ 
              y: [0, 15, 0],
              rotate: [12, -12, 12],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div
            className="absolute top-1/2 right-1/4 w-8 h-8"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary/20">
              <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
            </svg>
          </motion.div>
        </>
      )}
    </div>
  )
}

export function FloatingQuranVerse({ className = "" }: { className?: string }) {
  return (
    <motion.div 
      className={`text-6xl md:text-8xl font-arabic text-primary/5 select-none ${className}`}
      animate={{ opacity: [0.03, 0.08, 0.03] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      ﷽
    </motion.div>
  )
}
