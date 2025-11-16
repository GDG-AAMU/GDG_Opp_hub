import { z } from "zod"
import { OPPORTUNITY_TYPES } from "@/lib/constants"

export const submitOpportunitySchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL (e.g., https://example.com)"),
  company_name: z.string().optional(),
  opportunity_type: z.enum(OPPORTUNITY_TYPES as [string, ...string[]], {
    errorMap: () => ({ message: "Please select an opportunity type" }),
  }),
})

export type SubmitOpportunityFormData = z.infer<typeof submitOpportunitySchema>

