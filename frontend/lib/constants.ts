// Opportunity types
export const OPPORTUNITY_TYPES = [
  "internship",
  "full_time",
  "research",
  "fellowship",
  "scholarship",
] as const

export type OpportunityType = typeof OPPORTUNITY_TYPES[number]

// User roles
export const USER_ROLES = ["student", "admin"] as const

export type UserRole = typeof USER_ROLES[number]

// Opportunity status
export const OPPORTUNITY_STATUS = ["active", "expired"] as const

export type OpportunityStatus = typeof OPPORTUNITY_STATUS[number]

// Role types (for job roles)
export const ROLE_TYPES = [
  "Software Engineering",
  "Product Management",
  "Data Science",
  "UX Design",
  "Finance",
  "Marketing",
  "Other",
] as const

export type RoleType = typeof ROLE_TYPES[number]

