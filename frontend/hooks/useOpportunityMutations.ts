"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Opportunity } from "@/types"

interface UpdateOpportunityData {
  company_name: string
  job_title: string
  opportunity_type: string
  status: string
  deadline: string
  description: string
  requirements: string
  location: string
  role_type: string
  relevant_majors: string[]
}

// Update opportunity mutation
export function useUpdateOpportunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdateOpportunityData
    }) => {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error || "Failed to update opportunity")
      }

      return response.json() as Promise<Opportunity>
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["opportunities"] })

      // Snapshot the previous value
      const previousOpportunities = queryClient.getQueriesData({
        queryKey: ["opportunities"],
      })

      // Optimistically update to the new value
      queryClient.setQueriesData<{ data: Opportunity[]; pagination: any }>(
        { queryKey: ["opportunities"] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((opp) =>
              opp.id === id
                ? ({
                    ...opp,
                    ...data,
                    updated_at: new Date().toISOString(),
                  } as Opportunity)
                : opp
            ),
          }
        }
      )

      // Return context with snapshot
      return { previousOpportunities }
    },
    onError: (err, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousOpportunities) {
        context.previousOpportunities.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error(err instanceof Error ? err.message : "Failed to update opportunity")
    },
    onSuccess: (data, variables) => {
      toast.success("Opportunity updated successfully")
      // Invalidate all related caches
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      queryClient.invalidateQueries({ queryKey: ["opportunity", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["user-opportunities"] })
    },
    onSettled: () => {
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      queryClient.invalidateQueries({ queryKey: ["user-opportunities"] })
    },
  })
}

// Delete opportunity mutation
export function useDeleteOpportunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || "Failed to delete opportunity")
      }

      return response.json()
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["opportunities"] })

      // Snapshot the previous value
      const previousOpportunities = queryClient.getQueriesData({
        queryKey: ["opportunities"],
      })

      // Optimistically remove the opportunity
      queryClient.setQueriesData<{ data: Opportunity[]; pagination: any }>(
        { queryKey: ["opportunities"] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.filter((opp) => opp.id !== id),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          }
        }
      )

      // Return context with snapshot
      return { previousOpportunities }
    },
    onError: (err, id, context) => {
      // Rollback to previous value on error
      if (context?.previousOpportunities) {
        context.previousOpportunities.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete opportunity")
    },
    onSuccess: (data, id) => {
      toast.success("Opportunity deleted successfully")
      // Invalidate all related caches
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      queryClient.invalidateQueries({ queryKey: ["opportunity", id] })
      queryClient.invalidateQueries({ queryKey: ["user-opportunities"] })
    },
    onSettled: (data, error, id) => {
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      queryClient.invalidateQueries({ queryKey: ["opportunity", id] })
      queryClient.invalidateQueries({ queryKey: ["user-opportunities"] })
    },
  })
}

// Save/Apply opportunity mutation
export function useSaveApplyOpportunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      opportunityId,
      status,
    }: {
      opportunityId: string
      status: 'saved' | 'applied' | null
    }) => {
      if (status === null) {
        // Remove status
        const response = await fetch(`/api/user-opportunities?opportunityId=${opportunityId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to remove status')
        }

        return { success: true }
      } else {
        // Set status
        const response = await fetch('/api/user-opportunities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            opportunityId,
            status
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to ${status === 'saved' ? 'save' : 'apply to'} opportunity`)
        }

        return response.json()
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate all related caches
      queryClient.invalidateQueries({ queryKey: ["user-opportunities"] })
      queryClient.invalidateQueries({ queryKey: ["opportunities"] }) // For counts on dashboard
      queryClient.invalidateQueries({ queryKey: ["opportunity", variables.opportunityId] }) // For details page
      
      // Show success message
      if (variables.status === null) {
        toast.success('Removed successfully')
      } else if (variables.status === 'saved') {
        toast.success('Saved for later')
      } else {
        toast.success('Marked as applied')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    },
  })
}
