'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import OpportunityCard from './OpportunityCard'

interface Opportunity {
  id: string
  url: string
  company_name: string
  job_title: string
  opportunity_type: 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
  role_type: string | null
  relevant_majors: string[]
  deadline: string | null
  requirements: string | null
  location: string | null
  description: string | null
  status: 'active' | 'expired'
  created_at: string
}

export default function OpportunityList() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        
        const { data, error: fetchError } = await supabase
          .from('opportunities')
          .select('*')
          .eq('status', 'active')
          .order('deadline', { ascending: true, nullsFirst: false })

        if (fetchError) {
          throw fetchError
        }

        setOpportunities(data || [])
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching opportunities:', err)
        }
        setError(err instanceof Error ? err.message : 'Failed to load opportunities')
      } finally {
        setLoading(false)
      }
    }

    fetchOpportunities()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading opportunities...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <svg
              className="h-12 w-12 text-red-500 mx-auto mb-4"
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
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Error Loading Opportunities
            </h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (opportunities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <svg
              className="h-16 w-16 text-gray-400 mx-auto mb-4"
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
              No Opportunities Available
            </h3>
            <p className="text-gray-600 mb-4">
              There are currently no active opportunities. Check back later or submit a new one!
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Success state - display opportunities in a grid
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {opportunities.map((opportunity) => (
        <OpportunityCard key={opportunity.id} opportunity={opportunity} />
      ))}
    </div>
  )
}