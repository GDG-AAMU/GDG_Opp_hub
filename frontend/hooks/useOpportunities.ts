"use client"

import { useState, useEffect } from "react"
import { Opportunity } from "@/types"

// TODO: Implement opportunities hook with API calls
export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // TODO: Fetch opportunities from API
    setLoading(false)
  }, [])

  return {
    opportunities,
    loading,
    error,
    refetch: () => {},
  }
}

