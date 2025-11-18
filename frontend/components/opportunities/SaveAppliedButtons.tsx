'use client'

import { useState, useEffect } from 'react'
import { Bookmark, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSaveApplyOpportunity } from '@/hooks/useOpportunityMutations'

interface SaveAppliedButtonsProps {
  opportunityId: string
  currentStatus: 'saved' | 'applied' | null
  onStatusChange?: (status: 'saved' | 'applied' | null) => void
}

export default function SaveAppliedButtons({
  opportunityId,
  currentStatus,
  onStatusChange
}: SaveAppliedButtonsProps) {
  const [status, setStatus] = useState<'saved' | 'applied' | null>(currentStatus)
  const saveApplyMutation = useSaveApplyOpportunity()

  // Sync local state with prop changes (e.g., after refresh)
  useEffect(() => {
    setStatus(currentStatus)
  }, [currentStatus])

  const handleSave = async () => {
    if (saveApplyMutation.isPending) return

    const newStatus = status === 'saved' ? null : 'saved'
    
    try {
      await saveApplyMutation.mutateAsync({
        opportunityId,
        status: newStatus
      })

      setStatus(newStatus)
      onStatusChange?.(newStatus)
      
      if (newStatus === null) {
        // Success toast is handled by mutation hook
      } else {
        // Success toast is handled by mutation hook
      }
    } catch (error) {
      // Error toast is handled by mutation hook
    }
  }

  const handleApplied = async () => {
    if (saveApplyMutation.isPending) return

    const newStatus = status === 'applied' ? null : 'applied'
    
    try {
      await saveApplyMutation.mutateAsync({
        opportunityId,
        status: newStatus
      })

      setStatus(newStatus)
      onStatusChange?.(newStatus)
      
      if (newStatus === null) {
        // Success toast is handled by mutation hook
      } else {
        // Success toast is handled by mutation hook
      }
    } catch (error) {
      // Error toast is handled by mutation hook
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saveApplyMutation.isPending}
        variant={status === 'saved' ? 'default' : 'outline'}
        size="sm"
        className={`flex items-center gap-1.5 ${
          status === 'saved' 
            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
            : 'hover:bg-purple-50'
        }`}
        title={status === 'saved' ? 'Remove from saved' : 'Save for later'}
      >
        <Bookmark 
          className={`w-4 h-4 ${status === 'saved' ? 'fill-current' : ''}`} 
        />
        <span className="hidden sm:inline text-xs">
          {status === 'saved' ? 'Saved' : 'Save'}
        </span>
      </Button>

      {/* Applied Button */}
      <Button
        onClick={handleApplied}
        disabled={saveApplyMutation.isPending}
        variant={status === 'applied' ? 'default' : 'outline'}
        size="sm"
        className={`flex items-center gap-1.5 ${
          status === 'applied' 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'hover:bg-green-50'
        }`}
        title={status === 'applied' ? 'Remove from applied' : 'Mark as applied'}
      >
        <CheckCircle2 
          className={`w-4 h-4 ${status === 'applied' ? 'fill-current' : ''}`} 
        />
        <span className="hidden sm:inline text-xs">
          {status === 'applied' ? 'Applied' : 'Apply'}
        </span>
      </Button>
    </div>
  )
}

