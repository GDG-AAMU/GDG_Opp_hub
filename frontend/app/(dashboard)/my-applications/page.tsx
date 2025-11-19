'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import OpportunityCard from '@/components/opportunities/OpportunityCard'
import { Button } from '@/components/ui/button'
import { Bookmark, CheckCircle2 } from 'lucide-react'
import { useUserOpportunities } from '@/hooks/useUserOpportunities'
import type { UserOpportunity } from '@/hooks/useUserOpportunities'

type TabType = 'saved' | 'applied'

export default function MyApplicationsPage() {
  // Persist tab selection in localStorage
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('my-applications-tab') as TabType
      return savedTab === 'saved' || savedTab === 'applied' ? savedTab : 'saved'
    }
    return 'saved'
  })

  // Save tab to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('my-applications-tab', activeTab)
    }
  }, [activeTab])

  // Fetch current tab's opportunities
  const { opportunities, loading, error, invalidateCache } = useUserOpportunities(activeTab)
  
  // Fetch counts for both tabs
  const { opportunities: savedOpportunities } = useUserOpportunities('saved')
  const { opportunities: appliedOpportunities } = useUserOpportunities('applied')
  
  const savedCount = savedOpportunities.length
  const appliedCount = appliedOpportunities.length

  const handleStatusChange = (newStatus: 'saved' | 'applied' | null, opportunityId: string) => {
    // Invalidate cache to refetch data
    invalidateCache()
    
    // If status changed to 'applied' and we're on 'saved' tab, switch to 'applied' tab
    if (newStatus === 'applied' && activeTab === 'saved') {
      setActiveTab('applied')
    }
    // If status changed to 'saved' and we're on 'applied' tab, switch to 'saved' tab
    else if (newStatus === 'saved' && activeTab === 'applied') {
      setActiveTab('saved')
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Applications</h1>
            <p className="text-muted-foreground">Manage your saved and applied opportunities</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'saved'
                  ? 'border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bookmark className="w-5 h-5" />
              <span>Saved</span>
              {savedCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                  {savedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('applied')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'applied'
                  ? 'border-green-600 dark:border-green-400 text-green-600 dark:text-green-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Applied</span>
              {appliedCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                  {appliedCount}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading opportunities...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-destructive mb-2">Error</h3>
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={() => invalidateCache()} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md">
                <div className="bg-card border border-border rounded-lg p-8">
                  {activeTab === 'saved' ? (
                    <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  ) : (
                    <CheckCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  )}
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No {activeTab === 'saved' ? 'Saved' : 'Applied'} Opportunities
                  </h3>
                  <p className="text-muted-foreground mb-4">
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
                        offers_sponsorship: opp.offers_sponsorship ?? false,
                        requires_us_citizenship: opp.requires_us_citizenship ?? false,
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

