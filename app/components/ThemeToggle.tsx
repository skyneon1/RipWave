'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="w-10 h-10 rounded-full border border-rip-border bg-rip-surface/50 animate-pulse" />
        )
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative w-10 h-10 flex items-center justify-center rounded-full border border-rip-border bg-rip-surface/50 backdrop-blur-sm hover:border-rip-accent/50 transition-colors group overflow-hidden"
            aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ y: 20, opacity: 0, rotate: -45 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: -20, opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="text-rip-text group-hover:text-rip-accent transition-colors"
                >
                    {theme === 'dark' ? (
                        <Sun size={20} strokeWidth={1.5} />
                    ) : (
                        <Moon size={20} strokeWidth={1.5} />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Background glow effect */}
            <div className="absolute inset-0 bg-rip-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    )
}
