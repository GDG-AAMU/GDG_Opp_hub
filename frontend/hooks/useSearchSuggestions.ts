'use client'

import { useEffect, useRef, useState } from 'react'

interface UseSearchSuggestionsResult {
  suggestions: string[]
  loading: boolean
  error: string | null
}

export function useSearchSuggestions(query: string): UseSearchSuggestionsResult {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const cacheRef = useRef<Map<string, string[]>>(new Map())

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < 2) {
      setSuggestions([])
      setLoading(false)
      setError(null)
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
      return
    }

    const cacheKey = trimmed.toLowerCase()
    if (cacheRef.current.has(cacheKey)) {
      setSuggestions(cacheRef.current.get(cacheKey) || [])
      setLoading(false)
      setError(null)
      return
    }

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    const fetchSuggestions = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/opportunities/suggestions?query=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch suggestions')
        }

        const data = await response.json()
        cacheRef.current.set(cacheKey, data.suggestions || [])
        setSuggestions(data.suggestions || [])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        const message = err instanceof Error ? err.message : 'Failed to fetch suggestions'
        setError(message)
        setSuggestions([])
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null
          setLoading(false)
        }
      }
    }

    fetchSuggestions()

    return () => {
      controller.abort()
    }
  }, [query])

  return { suggestions, loading, error }
}
