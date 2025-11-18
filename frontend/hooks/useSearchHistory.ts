'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'opportunitySearchHistory'
const MAX_HISTORY = 5

const readHistory = (): string[] => {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch (error) {
    console.warn('Failed to parse search history', error)
    return []
  }
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([])

  const persistHistory = useCallback((items: string[]) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.warn('Failed to store search history', error)
    }
  }, [])

  useEffect(() => {
    setHistory(readHistory())
  }, [])

  const addSearchTerm = useCallback((term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return

    setHistory(prev => {
      const next = [trimmed, ...prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase())]
        .slice(0, MAX_HISTORY)
      persistHistory(next)
      return next
    })
  }, [persistHistory])

  const removeSearchTerm = useCallback((term: string) => {
    setHistory(prev => {
      const next = prev.filter(item => item !== term)
      persistHistory(next)
      return next
    })
  }, [persistHistory])

  const clearHistory = useCallback(() => {
    setHistory([])
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  return {
    history,
    addSearchTerm,
    removeSearchTerm,
    clearHistory,
  }
}
