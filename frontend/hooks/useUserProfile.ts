"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useAuth } from "./useAuth"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/lib/supabase/types"

type UserProfile = Database['public']['Tables']['users']['Row']

interface UseUserProfileReturn {
  profile: UserProfile | null
  opportunitiesCount: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  invalidateCache: () => void
}

async function fetchUserProfile(userId: string): Promise<{ profile: UserProfile; opportunitiesCount: number }> {
  const supabase = createClient()

  // Fetch user profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single<UserProfile>()

  if (userError) {
    throw new Error(userError.message || "Failed to fetch profile")
  }

  // Fetch count of opportunities submitted by this user
  const { count, error: countError } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('submitted_by', userId)

  if (countError && process.env.NODE_ENV === 'development') {
    console.error('Error fetching opportunities count:', countError)
  }

  return {
    profile: userData,
    opportunitiesCount: count || 0,
  }
}

export function useUserProfile(): UseUserProfileReturn {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Memoize query key
  const queryKey = useMemo(() => ['user-profile', user?.id] as const, [user?.id])

  // Memoize query function
  const queryFn = useMemo(() => {
    if (!user?.id) throw new Error("User ID is required")
    return () => fetchUserProfile(user.id)
  }, [user?.id])

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey,
    queryFn,
    enabled: !!user?.id, // Only fetch if user is logged in
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  const error = queryError ? (queryError as Error).message : null
  const profile = data?.profile || null
  const opportunitiesCount = data?.opportunitiesCount || 0

  // Invalidate cache function
  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] })
  }

  // Refetch function
  const refetch = async () => {
    await queryRefetch()
  }

  return {
    profile,
    opportunitiesCount,
    loading,
    error,
    refetch,
    invalidateCache,
  }
}

