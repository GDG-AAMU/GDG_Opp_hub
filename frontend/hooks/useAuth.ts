"use client"

// TODO: Implement authentication hook
export function useAuth() {
  return {
    user: null,
    loading: false,
    signIn: async () => {},
    signOut: async () => {},
    signUp: async () => {},
  }
}

