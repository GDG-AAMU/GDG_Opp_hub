'use client'

import { useState, useEffect } from 'react'
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
import type { Major, RoleType } from '@/lib/constants'

type OpportunityType = 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'

export default function DashboardPage() {
  const { loading: authLoading } = useAuth()
  const searchParams = useSearchParams()

  // Filter and sort state
  const [selectedTypes, setSelectedTypes] = useState<OpportunityType[]>([])
  const [selectedMajors, setSelectedMajors] = useState<Major[]>([])
  const [selectedRoles, setSelectedRoles] = useState<RoleType[]>([])
  const [selectedSort, setSelectedSort] = useState<SortOption>('deadline-asc')

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

  // Fetch opportunities using API hook - only when auth is ready
  const { opportunities, loading, error, refetch } = useOpportunities({
    types: selectedTypes,
    majors: selectedMajors,
    roles: selectedRoles,
    status: 'active',
    sort: selectedSort,
    autoFetch: !authLoading  // Don't fetch until auth is ready
  })

  const handleSubmitOpportunity = () => {
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    refetch()
  }

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

    const hasFilters = selectedTypes.length > 0 || selectedMajors.length > 0 || selectedRoles.length > 0

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
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Opportunities Found
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? 'No opportunities match your current filter. Try changing the filters or submit a new opportunity!'
                  : 'There are currently no active opportunities. Be the first to submit one!'}
              </p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))}
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Submit Button and Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <Button
              onClick={handleSubmitOpportunity}
              size="lg"
              className="shadow-lg hover:shadow-xl transition-shadow"
            >
              <Plus className="h-5 w-5 mr-2" />
              Submit New Opportunity
            </Button>

            <SortDropdown
              selectedSort={selectedSort}
              onSortChange={setSelectedSort}
            />
          </div>

          {/* Filter Bar */}
          <FilterBar
            selectedTypes={selectedTypes}
            onFilterChange={setSelectedTypes}
            selectedMajors={selectedMajors}
            onMajorChange={setSelectedMajors}
            selectedRoles={selectedRoles}
            onRoleChange={setSelectedRoles}
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
    </ProtectedRoute>
  )
}
