import { z } from "zod"
import { OPPORTUNITY_TYPES } from "@/lib/constants"

export const submitOpportunitySchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL (e.g., https://example.com)"),
  company_name: z.string().optional(),
  opportunity_type: z.enum(OPPORTUNITY_TYPES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Please select an opportunity type" }),
  }),
})

export type SubmitOpportunityFormData = z.infer<typeof submitOpportunitySchema>

const opportunityTypeEnum = OPPORTUNITY_TYPES as unknown as [
  string,
  ...string[],
]

export const editOpportunitySchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  job_title: z.string().min(1, "Job title is required"),
  opportunity_type: z.enum(opportunityTypeEnum, {
    errorMap: () => ({ message: "Select an opportunity type" }),
  }),
  status: z.enum(["active", "expired"], {
    errorMap: () => ({ message: "Select a status" }),
  }),
  deadline: z
    .string()
    .min(1, "Deadline is required")
    .refine(
      (value) => {
        const date = new Date(value)
        return !Number.isNaN(date.getTime())
      },
      { message: "Enter a valid date" }
    ),
  description: z.string().min(1, "Description is required"),
  requirements: z.string().min(1, "Requirements are required"),
  location: z.string().min(1, "Location is required"),
  role_type: z.string().min(1, "Role type is required"),
  relevant_majors: z
    .array(z.string().min(1))
    .min(1, "Add at least one relevant major"),
})

export type EditOpportunityFormData = z.infer<typeof editOpportunitySchema>
