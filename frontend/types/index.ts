import { OpportunityType, UserRole, OpportunityStatus, RoleType } from "@/lib/constants"
import { Database } from "@/lib/supabase/types"

// User type (from database)
export type User = Database["public"]["Tables"]["users"]["Row"]

// Base Opportunity type (from database)
type BaseOpportunity = Database["public"]["Tables"]["opportunities"]["Row"]

// Opportunity type with joined user data (when fetched with user name)
// Supabase returns joined data as nested object: { users: { name: string } }
export type Opportunity = Omit<BaseOpportunity, 'submitted_by'> & {
  submitted_by: string | { name: string } | null
  users?: { name: string } | null
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
  name: string
  major?: string
}

export interface SubmitOpportunityFormData {
  url: string
  company_name?: string
  opportunity_type: OpportunityType
}

