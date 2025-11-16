'use client'

import { Opportunity } from "@/types"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { useState } from "react"

interface OpportunityDetailsProps {
  opportunity: Opportunity
  isAdmin?: boolean
}

export default function OpportunityDetails({ opportunity, isAdmin = false }: OpportunityDetailsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Check if deadline is within 7 days
  const isDeadlineApproaching = () => {
    if (!opportunity.deadline) return false
    const deadline = new Date(opportunity.deadline)
    const today = new Date()
    const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilDeadline <= 7 && daysUntilDeadline >= 0
  }

  const handleShare = async () => {
    try {
      const url = window.location.href
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to copy link:', err)
      }
      toast.error('Failed to copy link')
    }
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Parse relevant_majors if it's a string
  const getRelevantMajors = () => {
    if (!opportunity.relevant_majors) return []
    if (typeof opportunity.relevant_majors === 'string') {
      try {
        return JSON.parse(opportunity.relevant_majors)
      } catch {
        return []
      }
    }
    return opportunity.relevant_majors
  }

  const relevantMajors = getRelevantMajors()

  const handleEdit = () => {
    // Navigate to edit page (to be implemented)
    router.push(`/admin/opportunities/${opportunity.id}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this opportunity? This action cannot be undone.")) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/opportunities/${opportunity.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to delete opportunities')
        } else if (response.status === 404) {
          throw new Error('Opportunity not found')
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to delete opportunity')
        }
      }

      toast.success('Opportunity deleted successfully')
      router.push('/dashboard')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete opportunity'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {/* Details Card */}
      <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
      {/* Header Section */}
      <div>
        {/* Top row with company name and action icons */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-4xl font-bold flex-1">{opportunity.company_name}</h1>
          
          {/* Icon buttons */}
          <div className="flex gap-2">
            {/* Share Button */}
            <Button 
              onClick={handleShare}
              size="icon"
              variant="outline"
              title="Share Link"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </Button>

            {/* Review Resume Button - Coming Soon */}
            <Button 
              disabled 
              size="icon"
              variant="outline"
              title="Review Resume - Coming Soon"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </Button>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">{opportunity.job_title}</h2>
        
        {/* Type Badge */}
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-block px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            {opportunity.opportunity_type}
          </span>
          {opportunity.role_type && (
            <span className="inline-block px-4 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
              {opportunity.role_type}
            </span>
          )}
        </div>

        {/* Key Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          {opportunity.location && (
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">{opportunity.location}</p>
            </div>
          )}
          
          {opportunity.deadline && (
            <div>
              <p className="text-sm text-gray-500">Deadline</p>
              <p className={`font-medium ${isDeadlineApproaching() ? 'text-red-600 font-bold' : ''}`}>
                {formatDate(opportunity.deadline)}
                {isDeadlineApproaching() && (
                  <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Closing Soon!
                  </span>
                )}
              </p>
            </div>
          )}

          {(opportunity.submitted_by || opportunity.users) && (
            <div>
              <p className="text-sm text-gray-500">Submitted By</p>
              <p className="font-medium">
                {opportunity.users?.name
                  ? opportunity.users.name
                  : typeof opportunity.submitted_by === 'object' && opportunity.submitted_by !== null && 'name' in opportunity.submitted_by
                  ? (opportunity.submitted_by as { name: string }).name
                  : 'Unknown User'}
              </p>
            </div>
          )}

          {opportunity.created_at && (
            <div>
              <p className="text-sm text-gray-500">Posted On</p>
              <p className="font-medium">{formatDate(opportunity.created_at)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{opportunity.description || 'No description available.'}</p>
      </div>

      {/* Requirements */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Requirements/Qualifications</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{opportunity.requirements || 'No requirements specified.'}</p>
      </div>

      {/* Relevant Majors */}
      {relevantMajors && relevantMajors.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Relevant Majors</h2>
          <div className="flex flex-wrap gap-2">
            {relevantMajors.map((major: string, index: number) => (
              <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {major}
              </span>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8">
        {/* Primary Action - Apply Now */}
        {opportunity.url && (
          <Button asChild size="lg" className="w-full">
            <a
              href={opportunity.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Apply Now
            </a>
          </Button>
        )}
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">Admin Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={handleEdit}
              size="lg"
              variant="outline"
              className="w-full bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500"
              disabled={isEditing}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              size="lg"
              variant="destructive"
              className="w-full"
              disabled={isDeleting}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
