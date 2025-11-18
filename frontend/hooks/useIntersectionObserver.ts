"use client"

import { useEffect, useRef, RefObject } from 'react'

interface UseIntersectionObserverOptions {
  target: RefObject<Element>
  onIntersect: () => void
  threshold?: number
  root?: Element | null
  rootMargin?: string
  enabled?: boolean
}

export function useIntersectionObserver({
  target,
  onIntersect,
  threshold = 0.1,
  root = null,
  rootMargin = '0px',
  enabled = true,
}: UseIntersectionObserverOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!enabled || !target.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect()
          }
        })
      },
      {
        threshold,
        root,
        rootMargin,
      }
    )

    observerRef.current = observer
    observer.observe(target.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [target, onIntersect, threshold, root, rootMargin, enabled])
}

