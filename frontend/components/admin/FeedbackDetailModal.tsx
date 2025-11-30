'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bug, Lightbulb, MessageSquare, FileQuestion, ExternalLink } from 'lucide-react'

type FeedbackType = 'bug' | 'feature_request' | 'general' | 'other'
type FeedbackStatus = 'new' | 'in_progress' | 'resolved'

interface FeedbackItem {
  id: string
  user_id: string | null
  user_name: string
  user_email: string | null
  feedback_type: FeedbackType
  subject: string
  description: string
  page_url: string | null
  status: FeedbackStatus
  admin_notes: string | null
  resolved_by: string | null
  resolved_by_name: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

interface FeedbackDetailModalProps {
  feedback: FeedbackItem
  isOpen: boolean
  onClose: () => void
}

const typeIcons: Record<FeedbackType, React.ReactNode> = {
  bug: <Bug className="w-5 h-5" />,
  feature_request: <Lightbulb className="w-5 h-5" />,
  general: <MessageSquare className="w-5 h-5" />,
  other: <FileQuestion className="w-5 h-5" />,
}

const typeLabels: Record<FeedbackType, string> = {
  bug: 'Bug Report',
  feature_request: 'Feature Request',
  general: 'General Feedback',
  other: 'Other',
}

const statusLabels: Record<FeedbackStatus, string> = {
  new: 'New',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

export default function FeedbackDetailModal({ feedback, isOpen, onClose }: FeedbackDetailModalProps) {
  const [status, setStatus] = useState<FeedbackStatus>(feedback.status)
  const [adminNotes, setAdminNotes] = useState(feedback.admin_notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdate = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/feedback/${feedback.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          admin_notes: adminNotes.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update feedback')
      }

      toast.success('Feedback updated successfully')
      onClose()
    } catch (error: any) {
      console.error('Error updating feedback:', error)
      toast.error(error.message || 'Failed to update feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/feedback/${feedback.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete feedback')
      }

      toast.success('Feedback deleted successfully')
      onClose()
    } catch (error: any) {
      console.error('Error deleting feedback:', error)
      toast.error(error.message || 'Failed to delete feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Feedback Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Type Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-foreground">
              {typeIcons[feedback.feedback_type]}
              <span className="font-medium">{typeLabels[feedback.feedback_type]}</span>
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label className="text-muted-foreground">Subject</Label>
            <p className="mt-1 text-lg font-medium text-foreground">{feedback.subject}</p>
          </div>

          {/* Description */}
          <div>
            <Label className="text-muted-foreground">Description</Label>
            <div className="mt-1 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="whitespace-pre-wrap text-sm text-foreground">{feedback.description}</p>
            </div>
          </div>

          {/* User Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Submitted By</Label>
              <p className="mt-1 font-medium text-foreground">{feedback.user_name}</p>
              {feedback.user_email && (
                <p className="text-sm text-muted-foreground">{feedback.user_email}</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Submitted On</Label>
              <p className="mt-1 text-foreground">
                {format(new Date(feedback.created_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>

          {/* Page URL */}
          {feedback.page_url && (
            <div>
              <Label className="text-muted-foreground">Page URL</Label>
              <a
                href={feedback.page_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
              >
                <span className="truncate">{feedback.page_url}</span>
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
              </a>
            </div>
          )}

          {/* Resolution Info */}
          {feedback.status === 'resolved' && feedback.resolved_at && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Label className="text-green-700 dark:text-green-400">Resolved</Label>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                Resolved by <span className="font-medium">{feedback.resolved_by_name || 'Unknown'}</span> on{' '}
                {format(new Date(feedback.resolved_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border"></div>

          {/* Status Update */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as FeedbackStatus)}>
              <SelectTrigger id="status" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Admin Notes */}
          <div>
            <Label htmlFor="admin-notes">Admin Notes (Internal)</Label>
            <textarea
              id="admin-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about this feedback..."
              rows={4}
              className="mt-1 w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
            >
              Delete Feedback
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpdate}
                disabled={isSubmitting}
                className="bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
