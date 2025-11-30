'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import {
  Bug,
  Lightbulb,
  MessageSquare,
  FileQuestion,
  Search,
  Filter,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import FeedbackDetailModal from './FeedbackDetailModal'

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

interface PaginationInfo {
  total: number
  limit: number
  offset: number
}

const typeIcons: Record<FeedbackType, React.ReactNode> = {
  bug: <Bug className="w-4 h-4" />,
  feature_request: <Lightbulb className="w-4 h-4" />,
  general: <MessageSquare className="w-4 h-4" />,
  other: <FileQuestion className="w-4 h-4" />,
}

const typeLabels: Record<FeedbackType, string> = {
  bug: 'Bug',
  feature_request: 'Feature',
  general: 'General',
  other: 'Other',
}

const typeColors: Record<FeedbackType, string> = {
  bug: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  feature_request: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  other: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const statusColors: Record<FeedbackStatus, string> = {
  new: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const statusLabels: Record<FeedbackStatus, string> = {
  new: 'New',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

export default function FeedbackSection() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 50,
    offset: 0,
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Modal
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const fetchFeedback = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        type: typeFilter,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/admin/feedback?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch feedback')
      }

      setFeedback(data.data)
      setPagination(data.pagination)
    } catch (error: any) {
      console.error('Error fetching feedback:', error)
      toast.error(error.message || 'Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter, searchTerm, pagination.limit, pagination.offset])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete feedback')
      }

      toast.success('Feedback deleted successfully')
      fetchFeedback()
    } catch (error: any) {
      console.error('Error deleting feedback:', error)
      toast.error(error.message || 'Failed to delete feedback')
    }
  }

  const handleViewDetails = (item: FeedbackItem) => {
    setSelectedFeedback(item)
    setIsDetailModalOpen(true)
  }

  const handleModalClose = () => {
    setIsDetailModalOpen(false)
    setSelectedFeedback(null)
    fetchFeedback() // Refresh list after modal closes
  }

  const stats = {
    total: pagination.total,
    new: feedback.filter((f) => f.status === 'new').length,
    in_progress: feedback.filter((f) => f.status === 'in_progress').length,
    resolved: feedback.filter((f) => f.status === 'resolved').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Feedback Management</h2>
        <p className="text-muted-foreground mt-1">View and manage user feedback submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Total Feedback</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">New</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">{stats.new}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{stats.in_progress}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{stats.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search subject or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No feedback found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {feedback.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[item.feedback_type]}`}>
                        {typeIcons[item.feedback_type]}
                        {typeLabels[item.feedback_type]}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm text-foreground">{item.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{item.user_name}</p>
                      {item.user_email && (
                        <p className="text-xs text-muted-foreground">{item.user_email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-400 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          isOpen={isDetailModalOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}
