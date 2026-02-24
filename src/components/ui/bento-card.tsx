import React from "react"
import { motion } from "framer-motion"

interface BentoCardProps {
  title: string
  value: string | number
  subtitle?: string
  colors: string[]
  delay: number
  className?: string
}

const BentoCard: React.FC<BentoCardProps> = React.memo(({
  title,
  value,
  subtitle,
  colors,
  delay,
  className = "",
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay + 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.5 } },
  }

  return (
    <motion.div
      className={`relative overflow-hidden h-full bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      <motion.div
        className="relative z-10 p-3 sm:p-5 md:p-8 text-gray-900 dark:text-white h-full flex flex-col justify-between"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h3 
          className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 font-medium" 
          variants={item}
        >
          {title}
        </motion.h3>
        <motion.p
          className="text-2xl sm:text-4xl md:text-5xl font-bold my-4 text-gray-900 dark:text-white"
          variants={item}
        >
          {value}
        </motion.p>
        {subtitle && (
          <motion.p 
            className="text-sm text-gray-600 dark:text-gray-400" 
            variants={item}
          >
            {subtitle}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  )
})

export { BentoCard }
