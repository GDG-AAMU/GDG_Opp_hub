"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { Opportunity } from "@/types"

interface UseOpportunityReturn {
  opportunity: Opportunity | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  invalidateCache: () => void
}

async function fetchOpportunity(id: string): Promise<Opportunity> {
  const response = await fetch(`/api/opportunities/${id}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Opportunity not found")
    } else if (response.status === 401) {
      throw new Error("Unauthorized. Please log in.")
    } else {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to load opportunity")
    }
  }

  return response.json()
}

export function useOpportunity(id: string | null): UseOpportunityReturn {
  const queryClient = useQueryClient()

  // Memoize query key
  const queryKey = useMemo(() => ['opportunity', id] as const, [id])

  // Memoize query function - lazy evaluation, only checks when called
  const queryFn = useMemo(() => {
    // Store id in closure to avoid stale closure issues
    const opportunityId = id
    return () => {
      if (!opportunityId) {
        return Promise.reject(new Error("Opportunity ID is required"))
      }
      return fetchOpportunity(opportunityId)
    }
  }, [id])

  const {
    data: opportunity,
    isLoading: loading,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey,
    queryFn,
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const error = queryError ? (queryError as Error).message : null

  // Invalidate cache function
  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: ['opportunity', id] })
    // Also invalidate opportunities list to keep them in sync
    queryClient.invalidateQueries({ queryKey: ['opportunities'] })
  }

  // Refetch function
  const refetch = async () => {
    await queryRefetch()
  }

  return {
    opportunity: opportunity || null,
    loading,
    error,
    refetch,
    invalidateCache,
  }
}

