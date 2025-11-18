'use client'

import { useState, useEffect } from 'react'
import { Bookmark, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

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
  const [loading, setLoading] = useState(false)

  // Sync local state with prop changes (e.g., after refresh)
  useEffect(() => {
    setStatus(currentStatus)
  }, [currentStatus])

  const handleSave = async () => {
    if (loading) return

    const newStatus = status === 'saved' ? null : 'saved'
    
    setLoading(true)
    try {
      if (newStatus === null) {
        // Remove status
        const response = await fetch(`/api/user-opportunities?opportunityId=${opportunityId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to remove saved status')
        }

        setStatus(null)
        onStatusChange?.(null)
        toast.success('Removed from saved')
      } else {
        // Set status to 'saved' - this will upsert (update if exists, insert if not)
        const response = await fetch('/api/user-opportunities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            opportunityId,
            status: 'saved'
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('API Error:', errorData)
          throw new Error(errorData.error || 'Failed to save opportunity')
        }

        const responseData = await response.json()
        console.log('Saved status saved:', responseData)

        setStatus('saved')
        onStatusChange?.('saved')
        toast.success('Saved for later')
      }
    } catch (error) {
      console.error('Error updating save status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleApplied = async () => {
    if (loading) return

    const newStatus = status === 'applied' ? null : 'applied'
    
    setLoading(true)
    try {
      if (newStatus === null) {
        // Remove status
        const response = await fetch(`/api/user-opportunities?opportunityId=${opportunityId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to remove applied status')
        }

        setStatus(null)
        onStatusChange?.(null)
        toast.success('Removed from applied')
      } else {
        // Set status to 'applied' - this will upsert (update if exists, insert if not)
        const response = await fetch('/api/user-opportunities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            opportunityId,
            status: 'applied'
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('API Error:', errorData)
          throw new Error(errorData.error || 'Failed to mark as applied')
        }

        const responseData = await response.json()
        console.log('Applied status saved:', responseData)

        const finalStatus = 'applied'
        setStatus(finalStatus)
        onStatusChange?.(finalStatus)
        toast.success('Marked as applied')
      }
    } catch (error) {
      console.error('Error updating applied status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={loading}
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
        disabled={loading}
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

