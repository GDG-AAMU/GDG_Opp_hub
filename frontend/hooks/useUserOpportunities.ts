"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useAuth } from "./useAuth"

type TabType = 'saved' | 'applied'

export interface UserOpportunity {
  id: string
  status: 'saved' | 'applied'
  applied_at: string | null
  created_at: string
  opportunities: {
    id: string
    company_name: string
    job_title: string
    opportunity_type: 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
    location: string | null
    deadline: string | null
    url: string
    status: 'active' | 'expired'
    created_at: string
  }
}

interface UseUserOpportunitiesReturn {
  opportunities: UserOpportunity[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  invalidateCache: () => void
}

async function fetchUserOpportunities(status: TabType | null): Promise<UserOpportunity[]> {
  const url = status 
    ? `/api/user-opportunities?status=${status}`
    : '/api/user-opportunities'
  
  const response = await fetch(url)
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized. Please log in.")
    }
    throw new Error("Failed to fetch opportunities")
  }
  
  const data = await response.json()
  return data.data || []
}

export function useUserOpportunities(status: TabType | null = null): UseUserOpportunitiesReturn {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Memoize query key
  const queryKey = useMemo(() => ['user-opportunities', status, user?.id] as const, [status, user?.id])

  // Memoize query function
  const queryFn = useMemo(() => () => fetchUserOpportunities(status), [status])

  const {
    data: opportunities = [],
    isLoading: loading,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey,
    queryFn,
    enabled: !!user, // Only fetch if user is logged in
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter than opportunities list since this changes more frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  const error = queryError ? (queryError as Error).message : null

  // Invalidate cache function
  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: ['user-opportunities'] })
    // Also invalidate opportunities list to keep counts in sync
    queryClient.invalidateQueries({ queryKey: ['opportunities'] })
  }

  // Refetch function
  const refetch = async () => {
    await queryRefetch()
  }

  return {
    opportunities,
    loading,
    error,
    refetch,
    invalidateCache,
  }
}

