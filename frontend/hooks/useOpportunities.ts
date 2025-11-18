"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback } from "react"
import { Opportunity } from "@/types"
import type { Major, RoleType } from "@/lib/constants"

type OpportunityType = 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
type OpportunityStatus = 'active' | 'expired'
type SortOption = 'deadline-asc' | 'deadline-desc' | 'recent' | 'company-asc'
type SponsorshipFilter = 'any' | 'offers' | 'no-offers'
type CitizenshipFilter = 'any' | 'required' | 'not-required'

interface UseOpportunitiesOptions {
  types?: OpportunityType[]
  majors?: Major[]
  roles?: RoleType[]
  sponsorship?: SponsorshipFilter
  citizenship?: CitizenshipFilter
  status?: OpportunityStatus
  sort?: SortOption
  limit?: number
  offset?: number
  search?: string
  autoFetch?: boolean
  refetchInterval?: number | false
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

interface OpportunitiesResponse {
  data: Opportunity[]
  pagination: PaginationInfo
}

// Generate query key based on filters (including search)
function getQueryKey(options: UseOpportunitiesOptions, offset: number = 0) {
  const {
    types = [],
    majors = [],
    roles = [],
    sponsorship = 'any',
    citizenship = 'any',
    status = 'active',
    sort = 'deadline-asc',
    limit = 20,
    search = '',
  } = options

  return [
    'opportunities',
    {
      types: types.sort(),
      majors: majors.sort(),
      roles: roles.sort(),
      sponsorship,
      citizenship,
      status,
      sort,
      limit,
      offset,
      search: search.trim(), // Include search in query key
    },
  ] as const
}

// Fetch opportunities function (with search support)
async function fetchOpportunities(
  options: UseOpportunitiesOptions,
  fetchOffset: number = 0
): Promise<OpportunitiesResponse> {
  const {
    types = [],
    majors = [],
    roles = [],
    sponsorship = 'any',
    citizenship = 'any',
    status = 'active',
    sort = 'deadline-asc',
    limit = 20,
    search = '',
  } = options

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
  if (sponsorship !== 'any') {
    params.append('sponsorship', sponsorship)
  }
  if (citizenship !== 'any') {
    params.append('citizenship', citizenship)
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

  const response = await fetch(`/api/opportunities?${params.toString()}`)

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized. Please log in.')
    }
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch opportunities: ${response.statusText}`)
  }

  const data = await response.json()
  return {
    data: data.data || [],
    pagination: data.pagination || { total: 0, limit, offset: fetchOffset, hasMore: false },
  }
}

export function useOpportunities(options: UseOpportunitiesOptions = {}): UseOpportunitiesReturn {
  const {
    offset = 0,
    limit = 20,
    autoFetch = true,
    refetchInterval = false,
  } = options

  const queryClient = useQueryClient()
  const [currentOffset, setCurrentOffset] = useState(offset)
  const [accumulatedData, setAccumulatedData] = useState<Opportunity[]>([])

  // Use React Query for data fetching
  const {
    data,
    isLoading,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: getQueryKey(options, currentOffset),
    queryFn: () => fetchOpportunities(options, currentOffset),
    enabled: autoFetch,
    refetchInterval: (query) => {
      // If refetchInterval is explicitly false, don't poll
      if (refetchInterval === false) return false

      // If refetchInterval is a number, use it
      if (typeof refetchInterval === 'number') {
        // Check if there are any "Loading..." opportunities in the current data
        const currentData = query.state.data as OpportunitiesResponse | undefined
        const hasLoadingOpps = currentData?.data.some(opp =>
          opp.job_title === 'Loading...' ||
          opp.company_name === 'Loading...'
        )
        // Only poll if there are loading opportunities
        return hasLoadingOpps ? refetchInterval : false
      }

      return false
    },
  })

  // Manage accumulated data for pagination
  const opportunities = currentOffset === 0 ? (data?.data || []) : accumulatedData
  const pagination = data?.pagination || null
  const error = queryError ? (queryError as Error).message : null

  // Invalidate cache function
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['opportunities'] })
  }, [queryClient])

  // Refetch from the beginning
  const refetch = useCallback(async () => {
    setCurrentOffset(0)
    setAccumulatedData([])
    await queryRefetch()
  }, [queryRefetch])

  // Fetch more for pagination
  const fetchMore = useCallback(async () => {
    if (pagination?.hasMore && !isLoading) {
      const newOffset = currentOffset + limit

      // Prefetch the next page
      const nextPageData = await queryClient.fetchQuery({
        queryKey: getQueryKey(options, newOffset),
        queryFn: () => fetchOpportunities(options, newOffset),
      })

      // Append new data to accumulated data
      setAccumulatedData(prev => {
        const combined = currentOffset === 0 ? [...(data?.data || []), ...nextPageData.data] : [...prev, ...nextPageData.data]
        return combined
      })
      setCurrentOffset(newOffset)
    }
  }, [pagination, isLoading, currentOffset, limit, queryClient, options, data])

  return {
    opportunities,
    loading: isLoading,
    error,
    pagination,
    refetch,
    fetchMore,
    invalidateCache,
  }
}

// Export utility function to invalidate opportunities cache
export function useInvalidateOpportunities() {
  const queryClient = useQueryClient()

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['opportunities'] })
  }, [queryClient])
}
