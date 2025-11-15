import { OpportunityType, UserRole, OpportunityStatus, RoleType } from "@/lib/constants"
import { Database } from "@/lib/supabase/types"

// User type (from database)
export type User = Database["public"]["Tables"]["users"]["Row"]

// Opportunity type (from database)
export type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"]

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

