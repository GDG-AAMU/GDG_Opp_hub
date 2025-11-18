"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Opportunity } from "@/types"
import type { Major, RoleType } from "@/lib/constants"

type OpportunityType = 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
type OpportunityStatus = 'active' | 'expired'
type SortOption = 'deadline-asc' | 'deadline-desc' | 'recent' | 'company-asc'

interface UseOpportunitiesOptions {
  types?: OpportunityType[]
  majors?: Major[]
  roles?: RoleType[]
  status?: OpportunityStatus
  sort?: SortOption
  limit?: number
  offset?: number
  search?: string
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
  invalidateCache: () => void
}

export function useOpportunities(options: UseOpportunitiesOptions = {}): UseOpportunitiesReturn {
  const {
    types = [],
    majors = [],
    roles = [],
    status = 'active',
    sort = 'deadline-asc',
    limit = 20,
    offset = 0,
    search = '',
    autoFetch = true
  } = options

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentOffset, setCurrentOffset] = useState(offset)
  const abortControllerRef = useRef<AbortController | null>(null)
  const cacheRef = useRef<Map<string, { data: Opportunity[]; pagination: PaginationInfo | null }>>(new Map())

  const fetchOpportunities = useCallback(async (fetchOffset: number = 0, append: boolean = false, skipCache: boolean = false) => {
    let controller: AbortController | null = null
    try {
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      if (types.length > 0) {
        params.append('type', types.join(','))
      }
      if (majors.length > 0) {
        params.append('majors', majors.join(','))
      }
      if (roles.length > 0) {
        params.append('roles', roles.join(','))
      }
      if (status) {
        params.append('status', status)
      }
      if (sort) {
        params.append('sort', sort)
      }
      const trimmedSearch = search?.trim()
      if (trimmedSearch) {
        params.append('search', trimmedSearch)
      }
      params.append('limit', limit.toString())
      params.append('offset', fetchOffset.toString())

      const cacheKey = params.toString()
      const canUseCache = !append && fetchOffset === 0 && !skipCache
      if (canUseCache && cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey)!
        setOpportunities(cached.data)
        setPagination(cached.pagination)
        setCurrentOffset(fetchOffset)
        setLoading(false)
        return
      }

      abortControllerRef.current?.abort()
      controller = new AbortController()
      abortControllerRef.current = controller

      setLoading(true)

      const response = await fetch(`/api/opportunities?${cacheKey}`, {
        signal: controller.signal
      })

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
        cacheRef.current.set(cacheKey, {
          data: data.data || [],
          pagination: data.pagination || null
        })
      }

      setPagination(data.pagination || null)
      setCurrentOffset(fetchOffset)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch opportunities'
      setError(errorMessage)
      if (!append) {
        setOpportunities([])
      }
    } finally {
      if (controller && abortControllerRef.current === controller) {
        abortControllerRef.current = null
        setLoading(false)
      }
    }
  }, [types, majors, roles, status, sort, limit, search])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
    }
  }, [])

  const invalidateCache = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  const refetch = useCallback(async () => {
    await fetchOpportunities(0, false, true)
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
    fetchMore,
    invalidateCache
  }
}
