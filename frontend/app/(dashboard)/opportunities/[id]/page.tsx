'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import OpportunityDetails from "@/components/opportunities/OpportunityDetails"
import { Opportunity } from "@/types"
import { useAuth } from "@/hooks/useAuth"
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
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch opportunity from API
        const response = await fetch(`/api/opportunities/${params.id}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError("Opportunity not found")
          } else if (response.status === 401) {
            setError("Unauthorized. Please log in.")
            router.push('/login')
          } else {
            const errorData = await response.json().catch(() => ({}))
            setError(errorData.error || "Failed to load opportunity")
          }
          return
        }

        const data = await response.json()
        setOpportunity(data)

        // Check if user is admin
        if (user) {
          try {
            const userResponse = await fetch('/api/auth/user-role')
            if (userResponse.ok) {
              const userData = await userResponse.json()
              setIsAdmin(userData.isAdmin || false)
            }
          } catch {
            // If we can't check admin status, default to false
            setIsAdmin(false)
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching opportunity:", err)
        }
        setError("An error occurred while loading the opportunity")
      } finally {
        setLoading(false)
      }
    }

    fetchOpportunity()
  }, [params.id, router, user])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-muted-foreground">Loading opportunity details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !opportunity) {
    return (
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
            onOpportunityUpdated={setOpportunity}
          />
        </div>
      </div>
      <Footer />
    </div>
  )
}
