"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { format, formatDistanceToNow } from "date-fns"
import { useAuth } from "@/hooks/useAuth"
import { useDeleteOpportunity } from "@/hooks/useOpportunityMutations"
import { Opportunity } from "@/types"
import { OPPORTUNITY_TYPES, OpportunityType } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import EditOpportunityModal from "./EditOpportunityModal"
import FeedbackSection from "./FeedbackSection"
import {
  ShieldCheck,
  Briefcase,
  Clock3,
  RefreshCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  Users as UsersIcon,
  AlertTriangle,
  Loader2,
  MessageSquare,
} from "lucide-react"

type StatusFilter = "all" | "active" | "expired"
type SortOption = "recent" | "deadline-asc" | "deadline-desc" | "company-asc"

interface AdminStats {
  total: number
  active: number
  expired: number
  users: number | null
}

interface AdminOverviewResponse {
  stats: AdminStats
  recent: Opportunity[]
}

interface PaginationInfo {
  total: number
  limit: number
  offset: number
}

const PAGE_SIZE = 10

const typeLabels: Record<OpportunityType, string> = {
  internship: "Internship",
  full_time: "Full-time",
  research: "Research",
  fellowship: "Fellowship",
  scholarship: "Scholarship",
}

const statusChipClasses: Record<"active" | "expired", string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

const getSubmittedByName = (opportunity: Opportunity) => {
  if (opportunity.users?.name) {
    return opportunity.users.name
  }
  if (
    opportunity.submitted_by &&
    typeof opportunity.submitted_by === "object" &&
    "name" in opportunity.submitted_by &&
    typeof (opportunity.submitted_by as { name: string }).name === "string"
  ) {
    return (opportunity.submitted_by as { name: string }).name
  }
  return "Unknown"
}

const formatDate = (value: string | null, fallback = "—") => {
  if (!value) return fallback
  try {
    return format(new Date(value), "MMM dd, yyyy")
  } catch {
    return fallback
  }
}

export default function AdminPanel() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const deleteOpportunity = useDeleteOpportunity()

  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'opportunities' | 'feedback'>('opportunities')

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentSubmissions, setRecentSubmissions] = useState<Opportunity[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [tableLoading, setTableLoading] = useState(false)
  const [tableError, setTableError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active")
  const [typeFilter, setTypeFilter] = useState<OpportunityType | "all">("all")
  const [sortOption, setSortOption] = useState<SortOption>("recent")

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null)
  const deleting = deleteOpportunity.isPending

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login?redirect=/admin")
      return
    }

    let isMounted = true

    const verifyAdmin = async () => {
      setCheckingAdmin(true)
      setAccessError(null)
      try {
        const response = await fetch("/api/auth/user-role")
        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/login?redirect=/admin")
            return
          }
          throw new Error("Unable to verify role")
        }
        const data = await response.json()
        if (!data.isAdmin) {
          toast.error("Admin access required")
          router.replace("/dashboard")
          return
        }
        if (isMounted) {
          setIsAdmin(true)
        }
      } catch (error) {
        if (isMounted) {
          setAccessError(
            error instanceof Error
              ? error.message
              : "Failed to verify admin access"
          )
        }
      } finally {
        if (isMounted) {
          setCheckingAdmin(false)
        }
      }
    }

    verifyAdmin()

    return () => {
      isMounted = false
    }
  }, [authLoading, user, router])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 400)
    return () => clearTimeout(handler)
  }, [search])

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return
    setStatsLoading(true)
    setStatsError(null)
    try {
      const response = await fetch("/api/admin/overview", {
        cache: "no-store",
      })
      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login?redirect=/admin")
          return
        }
        if (response.status === 403) {
          router.replace("/dashboard")
          return
        }
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload.error || "Failed to load stats")
      }
      const data: AdminOverviewResponse = await response.json()
      setStats(data.stats)
      setRecentSubmissions(data.recent || [])
      setLastRefreshed(new Date())
    } catch (error) {
      setStatsError(
        error instanceof Error ? error.message : "Failed to load stats"
      )
    } finally {
      setStatsLoading(false)
    }
  }, [isAdmin, router])

  const fetchOpportunities = useCallback(
    async (pageToFetch = 1) => {
      if (!isAdmin) return
      setTableLoading(true)
      setTableError(null)
      const offset = (pageToFetch - 1) * PAGE_SIZE
      try {
        const params = new URLSearchParams({
          limit: PAGE_SIZE.toString(),
          offset: offset.toString(),
          sort: sortOption,
          status: statusFilter,
        })

        if (typeFilter !== "all") {
          params.set("type", typeFilter)
        }
        if (debouncedSearch) {
          params.set("search", debouncedSearch)
        }

        const response = await fetch(`/api/opportunities?${params.toString()}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/login?redirect=/admin")
            return
          }
          if (response.status === 403) {
            router.replace("/dashboard")
            return
          }
          const errorPayload = await response.json().catch(() => ({}))
          throw new Error(errorPayload.error || "Failed to load opportunities")
        }

        const data = await response.json()
        setOpportunities(data.data || [])
        setPagination(data.pagination || { total: 0, limit: PAGE_SIZE, offset })
        setCurrentPage(pageToFetch)
      } catch (error) {
        setTableError(
          error instanceof Error ? error.message : "Failed to load opportunities"
        )
        setOpportunities([])
      } finally {
        setTableLoading(false)
      }
    },
    [isAdmin, debouncedSearch, sortOption, statusFilter, typeFilter, router]
  )

  useEffect(() => {
    if (!isAdmin) return
    fetchStats()
  }, [isAdmin, fetchStats])

  useEffect(() => {
    if (!isAdmin) return
    fetchOpportunities(1)
  }, [isAdmin, fetchOpportunities])

  const openEditDialog = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity)
    setEditDialogOpen(true)
  }

  const handleEditModalChange = (open: boolean) => {
    setEditDialogOpen(open)
    if (!open) {
      setSelectedOpportunity(null)
    }
  }

  const handleEditSuccess = (updatedOpportunity: Opportunity) => {
    setSelectedOpportunity(updatedOpportunity)
    setOpportunities((prev) =>
      prev.map((opportunity) =>
        opportunity.id === updatedOpportunity.id ? updatedOpportunity : opportunity
      )
    )
    setRecentSubmissions((prev) =>
      prev.map((opportunity) =>
        opportunity.id === updatedOpportunity.id ? updatedOpportunity : opportunity
      )
    )
    fetchOpportunities(currentPage)
    fetchStats()
  }

  const openDeleteDialog = (opportunity: Opportunity) => {
    setOpportunityToDelete(opportunity)
    setDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    if (deleting) return
    setDeleteDialogOpen(false)
    setOpportunityToDelete(null)
  }

  const handleDeleteOpportunity = async () => {
    if (!opportunityToDelete) return

    try {
      // Use optimistic delete mutation
      await deleteOpportunity.mutateAsync(opportunityToDelete.id)

      closeDeleteDialog()
      fetchOpportunities(currentPage)
      fetchStats()
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error("Delete failed:", error)
    }
  }

  const handleManualRefresh = () => {
    fetchStats()
    fetchOpportunities(currentPage)
  }

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / (pagination.limit || PAGE_SIZE)))
    : 1

  if (authLoading || checkingAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
        <p className="text-muted-foreground">Preparing admin controls...</p>
      </div>
    )
  }

  if (accessError) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
        <p className="font-semibold text-red-700 dark:text-red-400 mb-2">Access Error</p>
        <p className="text-red-600 dark:text-red-300 mb-4">{accessError}</p>
        <Button onClick={() => router.refresh()}>Try Again</Button>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Admin access granted</p>
          <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
        </div>
        {activeTab === 'opportunities' && (
          <Button variant="outline" onClick={handleManualRefresh} className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh Data
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`
              flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors
              ${activeTab === 'opportunities'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              }
            `}
          >
            <Briefcase className="h-5 w-5" />
            Opportunities
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`
              flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors
              ${activeTab === 'feedback'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              }
            `}
          >
            <MessageSquare className="h-5 w-5" />
            Feedback
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'opportunities' ? (
        <div className="space-y-8">

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Opportunities",
            value: stats?.total ?? 0,
            icon: Briefcase,
            accent: "from-purple-500 to-blue-500",
          },
          {
            label: "Active Listings",
            value: stats?.active ?? 0,
            icon: ShieldCheck,
            accent: "from-green-500 to-emerald-500",
          },
          {
            label: "Expired",
            value: stats?.expired ?? 0,
            icon: Clock3,
            accent: "from-orange-500 to-amber-500",
          },
          {
            label: "Registered Users",
            value: stats?.users ?? "—",
            icon: UsersIcon,
            accent: "from-blue-500 to-cyan-500",
          },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`rounded-lg bg-gradient-to-br ${card.accent} px-3 py-2 text-white shadow-md`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {statsLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="mt-6 text-3xl font-semibold text-foreground">
                {card.value}
              </p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
          )
        })}
      </section>

      {statsError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>{statsError}</span>
          </div>
          <Button variant="outline" onClick={fetchStats} size="sm">
            Retry
          </Button>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Opportunities
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage every opportunity in one place. Search, filter, edit, or retire listings.
            </p>
          </div>
          {lastRefreshed && (
            <p className="text-xs text-muted-foreground">
              Last synced {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by company or title"
                  className="pl-10"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setDebouncedSearch(search.trim())
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDebouncedSearch(search.trim())}
                disabled={tableLoading}
              >
                Apply
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as OpportunityType | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {OPPORTUNITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {typeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sort</Label>
            <Select
              value={sortOption}
              onValueChange={(value) => setSortOption(value as SortOption)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Newest first</SelectItem>
                <SelectItem value="deadline-asc">Deadline (soonest)</SelectItem>
                <SelectItem value="deadline-desc">Deadline (latest)</SelectItem>
                <SelectItem value="company-asc">Company (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Opportunity</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Submitted by</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tableLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                      <span>Loading opportunities...</span>
                    </div>
                  </td>
                </tr>
              ) : tableError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                      <p className="font-semibold text-foreground">
                        {tableError}
                      </p>
                      <Button variant="outline" onClick={() => fetchOpportunities(currentPage)}>
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : opportunities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <p className="text-muted-foreground">No opportunities found for the current filters.</p>
                  </td>
                </tr>
              ) : (
                opportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="hover:bg-muted/50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-foreground">
                        {opportunity.job_title || "Untitled role"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {opportunity.company_name}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-400">
                        {typeLabels[opportunity.opportunity_type]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusChipClasses[opportunity.status]}`}
                      >
                        {opportunity.status === "active" ? "Active" : "Expired"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDate(opportunity.deadline)}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDate(opportunity.created_at)}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {getSubmittedByName(opportunity)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-muted-foreground hover:text-purple-600"
                        >
                          <Link href={`/opportunities/${opportunity.id}`}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-purple-600"
                          onClick={() => openEditDialog(opportunity)}
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-400"
                          onClick={() => openDeleteDialog(opportunity)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {opportunities.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination?.offset || 0) + 1}-
              {Math.min(
                (pagination?.offset || 0) + PAGE_SIZE,
                pagination?.total || 0
              )}{" "}
              of {pagination?.total || 0} opportunities
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOpportunities(currentPage - 1)}
                disabled={currentPage === 1 || tableLoading}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm font-medium text-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOpportunities(currentPage + 1)}
                disabled={
                  currentPage === totalPages ||
                  tableLoading ||
                  opportunities.length === 0
                }
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Recent Submissions
            </h3>
            <p className="text-sm text-muted-foreground">
              Latest 10 opportunities submitted by the community
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {recentSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent submissions available.
            </p>
          ) : (
            recentSubmissions.map((opportunity) => (
              <div
                key={opportunity.id}
                className="rounded-xl border border-border bg-muted/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(opportunity.created_at ?? ""), {
                        addSuffix: true,
                      })}
                    </p>
                    <h4 className="text-lg font-semibold text-foreground">
                      {opportunity.job_title || "Untitled role"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {opportunity.company_name}
                    </p>
                  </div>
                  <span className="rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-400">
                    {typeLabels[opportunity.opportunity_type]}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  <p>
                    Submitted by{" "}
                    <span className="font-medium text-foreground">
                      {getSubmittedByName(opportunity)}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusChipClasses[opportunity.status]}`}
                    >
                      {opportunity.status === "active" ? "Active" : "Expired"}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/opportunities/${opportunity.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

        </div>
      ) : (
        <FeedbackSection />
      )}

      <EditOpportunityModal
        open={editDialogOpen}
        onOpenChange={handleEditModalChange}
        opportunity={selectedOpportunity}
        onSuccess={handleEditSuccess}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => (open ? setDeleteDialogOpen(true) : closeDeleteDialog())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete opportunity</DialogTitle>
            <DialogDescription>
              This will mark the opportunity as expired immediately. You can re-activate it later if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold">Are you sure?</p>
            <p>
              {opportunityToDelete?.job_title || "This opportunity"} at{" "}
              {opportunityToDelete?.company_name}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOpportunity} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
