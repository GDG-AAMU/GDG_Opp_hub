'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import OpportunityDetails from "@/components/opportunities/OpportunityDetails"
import { Opportunity } from "@/types"
import { useAuth } from "@/hooks/useAuth"

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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading opportunity details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto mt-8">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error || "Opportunity not found"}</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Opportunity Details Card */}
        <OpportunityDetails opportunity={opportunity} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
