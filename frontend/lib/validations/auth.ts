import { z } from "zod"

// Allowed email domains for AAMU students
const ALLOWED_EMAIL_DOMAINS = ['@aamu.edu', '@bulldogs.aamu.edu']

// Regex pattern to match allowed email domains (case-insensitive)
const AAMU_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(aamu\.edu|bulldogs\.aamu\.edu)$/i

export const signupSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .regex(
      AAMU_EMAIL_REGEX,
      "Only @aamu.edu and @bulldogs.aamu.edu email addresses are allowed"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  major: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type SignupFormData = z.infer<typeof signupSchema>
export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Validate if an email belongs to an allowed AAMU domain
 * Useful for server-side validation
 */
export function isAAMUEmail(email: string): boolean {
  return AAMU_EMAIL_REGEX.test(email)
}

/**
 * Get list of allowed email domains
 */
export function getAllowedDomains(): string[] {
  return ALLOWED_EMAIL_DOMAINS
}