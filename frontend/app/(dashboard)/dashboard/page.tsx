'use client'

import { useState, useEffect, useRef, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import FilterBar from '@/components/opportunities/FilterBar'
import SortDropdown, { SortOption } from '@/components/opportunities/SortDropdown'
import SubmitModal from '@/components/opportunities/SubmitModal'
import { Plus } from 'lucide-react'
import OpportunityCard from '@/components/opportunities/OpportunityCard'
import { useOpportunities } from '@/hooks/useOpportunities'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import type { Major, RoleType } from '@/lib/constants'
import SearchBar from '@/components/opportunities/SearchBar'
import { useDebounce } from '@/hooks/useDebounce'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

type OpportunityType = 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
type SponsorshipFilter = 'any' | 'offers' | 'no-offers'
type CitizenshipFilter = 'any' | 'required' | 'not-required'

const POPULAR_SEARCHES = [
  'Software Engineering',
  'Data Science',
  'Product Management',
  'Remote internship',
  'Full-time roles',
] as const

function DashboardContent() {
  const { loading: authLoading } = useAuth()
  const searchParams = useSearchParams()

  // Filter and sort state
  const [selectedTypes, setSelectedTypes] = useState<OpportunityType[]>([])
  const [selectedMajors, setSelectedMajors] = useState<Major[]>([])
  const [selectedRoles, setSelectedRoles] = useState<RoleType[]>([])
  const [selectedSponsorship, setSelectedSponsorship] = useState<SponsorshipFilter>('any')
  const [selectedCitizenship, setSelectedCitizenship] = useState<CitizenshipFilter>('any')
  const [selectedSort, setSelectedSort] = useState<SortOption>('deadline-asc')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 400)
  const debouncedSuggestionQuery = useDebounce(searchQuery, 250)
  const { history: recentSearches, addSearchTerm, clearHistory } = useSearchHistory()
  const {
    suggestions: autocompleteSuggestions,
    loading: suggestionsLoading,
    error: suggestionsError
  } = useSearchSuggestions(debouncedSuggestionQuery)

  // Read URL params on mount to set initial filter
  useEffect(() => {
    const typeParam = searchParams.get('type')
    if (typeParam) {
      // Validate that it's a valid opportunity type
      const validTypes: OpportunityType[] = ['internship', 'full_time', 'research', 'fellowship', 'scholarship']
      const type = typeParam as OpportunityType
      if (validTypes.includes(type)) {
        setSelectedTypes([type])
      }
    }
  }, [searchParams])

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch opportunities using API hook - with smart polling for background updates
  const { opportunities, loading, error, pagination, refetch, invalidateCache, fetchMore } = useOpportunities({
    types: selectedTypes,
    majors: selectedMajors,
    roles: selectedRoles,
    sponsorship: selectedSponsorship,
    citizenship: selectedCitizenship,
    status: 'active',
    sort: selectedSort,
    search: debouncedSearch,
    autoFetch: !authLoading,  // Don't fetch until auth is ready
    refetchInterval: !authLoading ? 5000 : false  // Poll every 5 seconds to catch background updates
  })

  // Check if any opportunities are still loading (show visual feedback)
  const hasLoadingOpportunities = useMemo(() => {
    return opportunities.some(opp =>
      opp.job_title === 'Loading...' ||
      opp.company_name === 'Loading...'
    )
  }, [opportunities])

  // Infinite scroll sentinel ref
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Infinite scroll intersection observer
  useIntersectionObserver({
    target: sentinelRef,
    onIntersect: () => {
      if (pagination?.hasMore && !loading) {
        fetchMore()
      }
    },
    threshold: 0.1,
    enabled: !authLoading && !loading && (pagination?.hasMore ?? false)
  })

  const handleSubmitOpportunity = () => {
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    invalidateCache()
    // Note: invalidateCache() already triggers refetch automatically, so refetch() is redundant
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleSuggestionSelect = (value: string) => {
    setSearchQuery(value)
    addSearchTerm(value)
  }

  const hasFilters = selectedTypes.length > 0 || selectedMajors.length > 0 || selectedRoles.length > 0 ||
    selectedSponsorship !== 'any' || selectedCitizenship !== 'any'
  const hasSearchQuery = debouncedSearch.trim().length > 0
  const totalResults = pagination?.total ?? opportunities.length
  useEffect(() => {
    if (debouncedSearch.trim().length >= 2) {
      addSearchTerm(debouncedSearch)
    }
  }, [debouncedSearch, addSearchTerm])
  const resultsSummary = useMemo(() => {
    if (loading || (!hasSearchQuery && !hasFilters && totalResults === 0)) {
      return null
    }

    const resultsLabel = totalResults === 1 ? 'result' : 'results'
    const searchSuffix = hasSearchQuery ? ` for "${debouncedSearch}"` : ''
    const filterSuffix = hasFilters && !hasSearchQuery ? ' with current filters' : hasFilters && hasSearchQuery ? ' with current filters' : ''

    return `${totalResults} ${resultsLabel} found${searchSuffix}${filterSuffix}`
  }, [debouncedSearch, hasFilters, hasSearchQuery, loading, totalResults])

  // Helper function to render opportunities list with different states
  const renderOpportunitiesList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading opportunities...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <svg
                className="h-12 w-12 text-destructive mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Error Loading Opportunities
              </h3>
              <p className="text-destructive/80">{error}</p>
              <Button
                onClick={() => refetch()}
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )
    }

    if (opportunities.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="bg-card border border-border rounded-lg p-8">
              <svg
                className="h-16 w-16 text-muted-foreground mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {hasSearchQuery ? 'No Results Found' : 'No Opportunities Found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {hasSearchQuery
                  ? `We couldn't find any opportunities matching "${debouncedSearch}". Try a different search term or clear your filters.`
                  : hasFilters
                  ? 'No opportunities match your current filter. Try changing the filters or submit a new opportunity!'
                  : 'There are currently no active opportunities. Be the first to submit one!'}
              </p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {loading && pagination?.hasMore && (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
              <span className="text-sm">Loading more opportunities...</span>
            </div>
          )}
          {!pagination?.hasMore && opportunities.length > 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              You&apos;ve reached the end of the list
            </p>
          )}
        </div>
      </>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Submit Button and Sort */}
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:flex-1">
                <Button
                  onClick={handleSubmitOpportunity}
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-shadow sm:w-auto"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Submit New Opportunity
                </Button>
                <div className="w-full sm:flex-1">
                  <SearchBar
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onSelectSuggestion={handleSuggestionSelect}
                    isLoading={loading}
                    recentSearches={recentSearches}
                    popularSearches={[...POPULAR_SEARCHES]}
                    onClearRecent={clearHistory}
                    autocompleteSuggestions={autocompleteSuggestions}
                    suggestionsLoading={suggestionsLoading}
                    suggestionsError={suggestionsError}
                    placeholder="Search opportunities..."
                  />
                </div>
              </div>

              <SortDropdown
                selectedSort={selectedSort}
                onSortChange={setSelectedSort}
              />
            </div>

            {resultsSummary && (
              <p className="text-sm text-gray-600">
                {resultsSummary}
              </p>
            )}
          </div>

          {/* Filter Bar */}
          <FilterBar
            selectedTypes={selectedTypes}
            onFilterChange={setSelectedTypes}
            selectedMajors={selectedMajors}
            onMajorChange={setSelectedMajors}
            selectedRoles={selectedRoles}
            onRoleChange={setSelectedRoles}
            selectedSponsorship={selectedSponsorship}
            onSponsorshipChange={setSelectedSponsorship}
            selectedCitizenship={selectedCitizenship}
            onCitizenshipChange={setSelectedCitizenship}
          />

          {/* Opportunities List */}
          {renderOpportunitiesList()}
        </div>

        {/* Submit Modal */}
        <SubmitModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={handleModalSuccess}
        />
      </div>
      <Footer />
    </ProtectedRoute>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
          <Navbar />
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
        <Footer />
      </ProtectedRoute>
    }>
      <DashboardContent />
    </Suspense>
  )
}
