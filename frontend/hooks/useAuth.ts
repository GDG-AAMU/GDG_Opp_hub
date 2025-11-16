'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { SignupFormData, LoginFormData } from '@/lib/validations/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

const signUp = async (data: SignupFormData) => {
  const { email, password, name, major } = data

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        major,
      },
    },
  })

  if (authError) throw authError

  // Check if email already exists (identities array will be empty if account exists)
  const hasNoIdentities = authData.user?.identities?.length === 0
  if (hasNoIdentities) {
    throw new Error('An account with this email already exists. Please log in instead.')
  }

  return authData
}

  const signIn = async (data: LoginFormData) => {
    const { email, password } = data
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return authData
  }

  const signInWithGoogle = async () => {
    const redirectUrl = globalThis.window === undefined
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      : `${globalThis.window.location.origin}/dashboard`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  }
}