'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import OpportunityCard from '@/components/opportunities/OpportunityCard'
import { Button } from '@/components/ui/button'
import { Bookmark, CheckCircle2 } from 'lucide-react'

type TabType = 'saved' | 'applied'

interface UserOpportunity {
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
    offers_sponsorship: boolean
    requires_us_citizenship: boolean
  }
}

export default function MyApplicationsPage() {
  // Persist tab selection in localStorage
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('my-applications-tab') as TabType
      return savedTab === 'saved' || savedTab === 'applied' ? savedTab : 'saved'
    }
    return 'saved'
  })
  const [opportunities, setOpportunities] = useState<UserOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Save tab to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('my-applications-tab', activeTab)
    }
  }, [activeTab])

  const fetchOpportunities = async (status: TabType) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/user-opportunities?status=${status}`)
      if (!response.ok) {
        throw new Error('Failed to fetch opportunities')
      }
      const data = await response.json()
      setOpportunities(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunities')
      setOpportunities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunities(activeTab)
  }, [activeTab])

  const [savedCount, setSavedCount] = useState(0)
  const [appliedCount, setAppliedCount] = useState(0)

  // Fetch counts separately
  const fetchCounts = async () => {
    try {
      const [savedRes, appliedRes] = await Promise.all([
        fetch('/api/user-opportunities?status=saved'),
        fetch('/api/user-opportunities?status=applied')
      ])
      const savedData = await savedRes.json()
      const appliedData = await appliedRes.json()
      setSavedCount(savedData.data?.length || 0)
      setAppliedCount(appliedData.data?.length || 0)
    } catch (err) {
      console.error('Error fetching counts:', err)
    }
  }

  useEffect(() => {
    fetchCounts()
  }, [])

  const handleStatusChange = (newStatus: 'saved' | 'applied' | null, opportunityId: string) => {
    // Remove the opportunity from current list immediately (optimistic update)
    setOpportunities(prev => prev.filter(opp => opp.opportunities.id !== opportunityId))
    
    // Update counts
    fetchCounts()
    
    // If status changed to 'applied' and we're on 'saved' tab, switch to 'applied' tab
    if (newStatus === 'applied' && activeTab === 'saved') {
      // Switch tab - useEffect will trigger fetchOpportunities('applied')
      setActiveTab('applied')
    }
    // If status changed to 'saved' and we're on 'applied' tab, switch to 'saved' tab
    else if (newStatus === 'saved' && activeTab === 'applied') {
      // Switch tab - useEffect will trigger fetchOpportunities('saved')
      setActiveTab('saved')
    }
    // If status was removed, refetch current tab
    else if (newStatus === null) {
      fetchOpportunities(activeTab)
    }
    // If status changed but we're already on the correct tab, refetch to show updated data
    else if ((newStatus === 'applied' && activeTab === 'applied') || (newStatus === 'saved' && activeTab === 'saved')) {
      fetchOpportunities(activeTab)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Navbar />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
            <p className="text-gray-600">Manage your saved and applied opportunities</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'saved'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bookmark className="w-5 h-5" />
              <span>Saved</span>
              {savedCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                  {savedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('applied')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'applied'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Applied</span>
              {appliedCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                  {appliedCount}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading opportunities...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <Button onClick={() => fetchOpportunities(activeTab)} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
                  {activeTab === 'saved' ? (
                    <Bookmark className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  ) : (
                    <CheckCircle2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  )}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No {activeTab === 'saved' ? 'Saved' : 'Applied'} Opportunities
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {activeTab === 'saved'
                      ? "You haven't saved any opportunities yet. Start browsing and save opportunities you're interested in!"
                      : "You haven't marked any opportunities as applied yet. When you apply to an opportunity, it will appear here."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((userOpp) => {
                const opp = userOpp.opportunities
                return (
                  <div key={opp.id}>
                    <OpportunityCard
                      opportunity={{
                        id: opp.id,
                        url: opp.url,
                        company_name: opp.company_name,
                        job_title: opp.job_title,
                        opportunity_type: opp.opportunity_type,
                        location: opp.location,
                        deadline: opp.deadline,
                        offers_sponsorship: opp.offers_sponsorship,
                        requires_us_citizenship: opp.requires_us_citizenship,
                        userStatus: userOpp.status
                      }}
                      onStatusChange={(status) => handleStatusChange(status, opp.id)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  )
}

