'use client'

import { Opportunity } from "@/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { useEffect, useState } from "react"
import { Loader2, CheckCircle2, Bookmark } from "lucide-react"
import EditOpportunityModal from "@/components/admin/EditOpportunityModal"
import AddToCalendarButton from "./AddToCalendarButton"
import SocialShareButton from "./SocialShareButton"
import { CompanyLogo } from "@/components/ui/CompanyLogo"
import { useSaveApplyOpportunity } from "@/hooks/useOpportunityMutations"

interface OpportunityDetailsProps {
  opportunity: Opportunity
  isAdmin?: boolean
  onOpportunityUpdated?: (opportunity: Opportunity) => void
}

export default function OpportunityDetails({
  opportunity,
  isAdmin = false,
  onOpportunityUpdated,
}: OpportunityDetailsProps) {
  const router = useRouter()
  const [currentOpportunity, setCurrentOpportunity] = useState<Opportunity>(opportunity)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [appliedStatus, setAppliedStatus] = useState<'applied' | null>(
    opportunity.userStatus === 'applied' ? 'applied' : null
  )
  const [savedStatus, setSavedStatus] = useState<'saved' | null>(
    opportunity.userStatus === 'saved' ? 'saved' : null
  )
  const saveApplyMutation = useSaveApplyOpportunity()

  useEffect(() => {
    setCurrentOpportunity(opportunity)
    setAppliedStatus(opportunity.userStatus === 'applied' ? 'applied' : null)
    setSavedStatus(opportunity.userStatus === 'saved' ? 'saved' : null)
  }, [opportunity])

  const handleMarkAsApplied = async () => {
    if (saveApplyMutation.isPending) return

    const newStatus = appliedStatus === 'applied' ? null : 'applied'

    try {
      await saveApplyMutation.mutateAsync({
        opportunityId: currentOpportunity.id,
        status: newStatus
      })

      setAppliedStatus(newStatus)
      // Cache invalidation is handled by the mutation hook
    } catch (error) {
      // Error toast is handled by mutation hook
    }
  }

  const handleSave = async () => {
    if (saveApplyMutation.isPending) return

    const newStatus = savedStatus === 'saved' ? null : 'saved'

    try {
      await saveApplyMutation.mutateAsync({
        opportunityId: currentOpportunity.id,
        status: newStatus
      })

      setSavedStatus(newStatus)
      // Cache invalidation is handled by the mutation hook
    } catch (error) {
      // Error toast is handled by mutation hook
    }
  }

  // Check if deadline is within 7 days
  const isDeadlineApproaching = () => {
    if (!currentOpportunity.deadline) return false
    const deadline = new Date(currentOpportunity.deadline)
    const today = new Date()
    const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilDeadline <= 7 && daysUntilDeadline >= 0
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
    if (!currentOpportunity.relevant_majors) return []
    if (typeof currentOpportunity.relevant_majors === 'string') {
      try {
        return JSON.parse(currentOpportunity.relevant_majors)
      } catch {
        return []
      }
    }
    return currentOpportunity.relevant_majors
  }

  const relevantMajors = getRelevantMajors()

  const closeDeleteDialog = () => {
    if (isDeleting) return
    setDeleteDialogOpen(false)
  }

  const handleDeleteOpportunity = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/opportunities/${currentOpportunity.id}`, {
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
      setDeleteDialogOpen(false)
      router.push('/dashboard')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete opportunity'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpportunityRefresh = (updated: Opportunity) => {
    setCurrentOpportunity(updated)
    onOpportunityUpdated?.(updated)
    router.refresh()
  }

  return (
    <>
      {/* Details Card */}
      <div className="relative rounded-lg overflow-hidden">
        {/* Colorful gradient border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-blue-500 via-green-500 to-yellow-500"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-blue-500 via-green-500 to-yellow-500"></div>
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-red-500 via-blue-500 via-green-500 to-yellow-500"></div>
        <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-b from-red-500 via-blue-500 via-green-500 to-yellow-500"></div>

        <div className="bg-card rounded-lg shadow-md p-8 space-y-6 border border-border m-1">
        {/* Header Section */}
        <div>
          {/* Company Logo */}
          <div className="mb-4">
            <CompanyLogo
              companyName={currentOpportunity.company_name}
              url={currentOpportunity.url}
              size={80}
            />
          </div>

          {/* Top row with company name and action icons */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-4xl font-bold flex-1 text-foreground">{currentOpportunity.company_name}</h1>

            {/* Action icons - Top Right */}
            <div className="flex gap-2 flex-wrap">
              {/* Add to Calendar Button */}
              <AddToCalendarButton
                opportunity={{
                  id: currentOpportunity.id,
                  company_name: currentOpportunity.company_name,
                  job_title: currentOpportunity.job_title,
                  deadline: currentOpportunity.deadline,
                  location: currentOpportunity.location,
                  url: currentOpportunity.url
                }}
                size="sm"
              />

              {/* Share Button */}
              <SocialShareButton
                opportunity={{
                  opportunity_type: currentOpportunity.opportunity_type,
                  job_title: currentOpportunity.job_title,
                  company_name: currentOpportunity.company_name
                }}
                pageUrl={typeof window !== 'undefined' ? window.location.href : ''}
                size="sm"
              />

              {/* Review Resume Button - Coming Soon */}
              <Button
                disabled
                size="sm"
                variant="outline"
                title="Review Resume - Coming Soon"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </Button>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-foreground mb-3">{currentOpportunity.job_title}</h2>

          {/* Type Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-4 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold">
              {currentOpportunity.opportunity_type}
            </span>
            {currentOpportunity.role_type && (
              <span className="inline-block px-4 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                {currentOpportunity.role_type}
              </span>
            )}
          </div>

          {/* Sponsorship & Citizenship Badges */}
          {(currentOpportunity.offers_sponsorship === false || currentOpportunity.requires_us_citizenship === true) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {currentOpportunity.offers_sponsorship === false && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                  🛂 Does NOT offer sponsorship
                </span>
              )}
              {currentOpportunity.requires_us_citizenship === true && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                  🇺🇸 Requires U.S. Citizenship
                </span>
              )}
            </div>
          )}

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
            {currentOpportunity.location && (
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium text-foreground">{currentOpportunity.location}</p>
              </div>
            )}

            {currentOpportunity.deadline && (
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className={`font-medium text-foreground ${isDeadlineApproaching() ? 'text-destructive font-bold' : ''}`}>
                  {formatDate(currentOpportunity.deadline)}
                  {isDeadlineApproaching() && (
                    <span className="ml-2 text-xs bg-destructive/10 dark:bg-destructive/20 text-destructive px-2 py-1 rounded">
                      Closing Soon!
                    </span>
                  )}
                </p>
              </div>
            )}

            {(currentOpportunity.submitted_by || currentOpportunity.users) && (
              <div>
                <p className="text-sm text-muted-foreground">Submitted By</p>
                <p className="font-medium text-foreground">
                  {currentOpportunity.users?.name
                    ? currentOpportunity.users.name
                    : typeof currentOpportunity.submitted_by === 'object' && currentOpportunity.submitted_by !== null && 'name' in currentOpportunity.submitted_by
                      ? (currentOpportunity.submitted_by as { name: string }).name
                      : 'Unknown User'}
                </p>
              </div>
            )}

            {currentOpportunity.created_at && (
              <div>
                <p className="text-sm text-muted-foreground">Posted On</p>
                <p className="font-medium text-foreground">{formatDate(currentOpportunity.created_at)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Description</h2>
          <p className="text-foreground whitespace-pre-wrap">{currentOpportunity.description || 'No description available.'}</p>
        </div>

        {/* Requirements */}
        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Requirements/Qualifications</h2>
          {currentOpportunity.requirements ? (
            <ul className="list-disc list-inside space-y-2 text-foreground">
              {(() => {
                // Try splitting by newlines first
                let items = currentOpportunity.requirements.split('\n').filter(line => line.trim())

                // If we only get 1 item, try splitting by sentence-ending patterns
                if (items.length === 1) {
                  // Split by period followed by space and capital letter, or newline
                  items = currentOpportunity.requirements
                    .split(/\.(?=\s+[A-Z])/g)
                    .map(item => item.trim())
                    .filter(item => item.length > 0)
                }

                return items.map((requirement, index) => {
                  // Clean up bullet markers and trailing periods
                  let cleaned = requirement.trim().replace(/^[•\-\*]\s*/, '').replace(/\.$/, '')
                  return (
                    <li key={index} className="ml-2">
                      {cleaned}
                    </li>
                  )
                })
              })()}
            </ul>
          ) : (
            <p className="text-foreground">No requirements specified.</p>
          )}
        </div>
        {/* Relevant Majors */}
        {relevantMajors && relevantMajors.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">Relevant Majors</h2>
            <div className="flex flex-wrap gap-2">
              {relevantMajors.map((major: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm">
                  {major}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons - Centered at Bottom */}
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-border">
          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saveApplyMutation.isPending}
            variant={savedStatus === 'saved' ? 'default' : 'outline'}
            size="default"
            className={`flex items-center gap-2 ${
              savedStatus === 'saved'
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'hover:bg-purple-50'
            }`}
            title={savedStatus === 'saved' ? 'Remove from saved' : 'Save for later'}
          >
            <Bookmark
              className={`w-4 h-4 ${savedStatus === 'saved' ? 'fill-current' : ''}`}
            />
            <span className="text-sm">
              {savedStatus === 'saved' ? 'Saved' : 'Save'}
            </span>
          </Button>

          {/* Mark as Applied Button */}
          <Button
            onClick={handleMarkAsApplied}
            disabled={saveApplyMutation.isPending}
            size="default"
            className={`flex items-center gap-2 ${
              appliedStatus === 'applied'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0'
            }`}
          >
            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
              appliedStatus === 'applied' ? 'border-white bg-white' : 'border-white bg-transparent'
            }`}>
              {appliedStatus === 'applied' && (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            {appliedStatus === 'applied' ? 'Marked as Applied' : 'Mark as Applied'}
          </Button>
        </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8">
        {/* Primary Action - Apply Now */}
        {currentOpportunity.url && (
          <Button asChild size="lg" className="w-full">
            <a
              href={currentOpportunity.url}
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
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">Admin Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() => setEditModalOpen(true)}
              size="lg"
              variant="outline"
              className="w-full bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              size="lg"
              variant="destructive"
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          </div>
        </div>
      )}
      {editModalOpen && (
        <EditOpportunityModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          opportunity={currentOpportunity}
          onSuccess={handleOpportunityRefresh}
        />
      )}

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => (open ? setDeleteDialogOpen(true) : closeDeleteDialog())}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete opportunity</DialogTitle>
            <DialogDescription>
              This will remove the opportunity and cannot be undone. You can re-create it later if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold">Are you sure?</p>
            <p>
              {currentOpportunity.job_title || "This opportunity"} at{" "}
              {currentOpportunity.company_name}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOpportunity} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
