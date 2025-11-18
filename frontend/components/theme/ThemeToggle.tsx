"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "./ThemeProvider"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    if (resolvedTheme === "light") {
      setTheme("dark")
    } else {
      setTheme("light")
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-background border border-border hover:bg-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
      <Moon className="absolute top-2 left-2 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}

