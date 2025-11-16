"use client"

import { useState, useEffect, useCallback } from "react"
import { Opportunity } from "@/types"

type OpportunityType = 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
type OpportunityStatus = 'active' | 'expired'
type SortOption = 'deadline-asc' | 'deadline-desc' | 'recent' | 'company-asc'

interface UseOpportunitiesOptions {
  types?: OpportunityType[]
  status?: OpportunityStatus
  sort?: SortOption
  limit?: number
  offset?: number
  autoFetch?: boolean
}

interface PaginationInfo {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

interface UseOpportunitiesReturn {
  opportunities: Opportunity[]
  loading: boolean
  error: string | null
  pagination: PaginationInfo | null
  refetch: () => Promise<void>
  fetchMore: () => Promise<void>
}

export function useOpportunities(options: UseOpportunitiesOptions = {}): UseOpportunitiesReturn {
  const {
    types = [],
    status = 'active',
    sort = 'deadline-asc',
    limit = 20,
    offset = 0,
    autoFetch = true
  } = options

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentOffset, setCurrentOffset] = useState(offset)

  const fetchOpportunities = useCallback(async (fetchOffset: number = 0, append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      if (types.length > 0) {
        params.append('type', types.join(','))
      }
      if (status) {
        params.append('status', status)
      }
      if (sort) {
        params.append('sort', sort)
      }
      params.append('limit', limit.toString())
      params.append('offset', fetchOffset.toString())

      const response = await fetch(`/api/opportunities?${params.toString()}`)

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please log in.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch opportunities: ${response.statusText}`)
      }

      const data = await response.json()

      if (append) {
        setOpportunities(prev => [...prev, ...(data.data || [])])
      } else {
        setOpportunities(data.data || [])
      }

      setPagination(data.pagination || null)
      setCurrentOffset(fetchOffset)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch opportunities'
      setError(errorMessage)
      if (!append) {
        setOpportunities([])
      }
    } finally {
      setLoading(false)
    }
  }, [types, status, sort, limit])

  const refetch = useCallback(async () => {
    await fetchOpportunities(0, false)
  }, [fetchOpportunities])

  const fetchMore = useCallback(async () => {
    if (pagination?.hasMore && !loading) {
      await fetchOpportunities(currentOffset + limit, true)
    }
  }, [fetchOpportunities, pagination, loading, currentOffset, limit])

  useEffect(() => {
    if (autoFetch) {
      fetchOpportunities(0, false)
    }
  }, [autoFetch, fetchOpportunities])

  return {
    opportunities,
    loading,
    error,
    pagination,
    refetch,
    fetchMore
  }
}
