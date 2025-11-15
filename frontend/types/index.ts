import { OpportunityType, UserRole, OpportunityStatus, RoleType } from "@/lib/constants"

// User type
export interface User {
  id: string
  email: string
  name: string
  major: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

// Opportunity type
export interface Opportunity {
  id: string
  url: string
  company_name: string
  job_title: string
  opportunity_type: OpportunityType
  role_type: string
  relevant_majors: string[]
  deadline: string | null
  requirements: string
  location: string
  description: string
  submitted_by: string
  status: OpportunityStatus
  created_at: string
  expired_at: string | null
  ai_parsed_data: Record<string, unknown> | null
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

