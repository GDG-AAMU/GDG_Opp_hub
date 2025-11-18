'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import OpportunityDetails from "@/components/opportunities/OpportunityDetails"
import { useAuth } from "@/hooks/useAuth"
import { useOpportunity } from "@/hooks/useOpportunity"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import PageHeader from "@/components/layout/PageHeader"

export default function OpportunityDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { user } = useAuth()
  const { opportunity, loading, error, invalidateCache } = useOpportunity(params.id)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      return
    }

    const checkAdmin = async () => {
      try {
        const userResponse = await fetch('/api/auth/user-role')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setIsAdmin(userData.isAdmin || false)
        }
      } catch {
        setIsAdmin(false)
      }
    }

    checkAdmin()
  }, [user])

  // Handle unauthorized error - redirect to login
  useEffect(() => {
    if (error === "Unauthorized. Please log in.") {
      router.push('/login')
    }
  }, [error, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageHeader />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-muted-foreground">Loading opportunity details...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageHeader />
        <div className="container mx-auto p-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-2xl mx-auto mt-8">
            <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
            <p className="text-destructive/80 mb-4">{error || "Opportunity not found"}</p>
            <button
              onClick={() => router.back()}
              className="text-primary hover:text-primary/80 underline"
            >
              Go back
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHeader />
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <OpportunityDetails
            opportunity={opportunity}
            isAdmin={isAdmin}
            onOpportunityUpdated={(updatedOpportunity) => {
              // Invalidate cache when opportunity is updated
              invalidateCache()
            }}
          />
        </div>
      </div>
      <Footer />
    </div>
  )
}
