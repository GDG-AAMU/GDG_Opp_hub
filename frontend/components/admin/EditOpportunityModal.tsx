"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { useUpdateOpportunity } from "@/hooks/useOpportunityMutations"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Opportunity } from "@/types"
import {
  MAJORS,
  OPPORTUNITY_TYPES,
  ROLE_TYPES,
  OpportunityType,
} from "@/lib/constants"
import {
  EditOpportunityFormData,
  editOpportunitySchema,
} from "@/lib/validations/opportunity"

interface EditOpportunityModalProps {
  open: boolean
  opportunity: Opportunity | null
  onOpenChange: (open: boolean) => void
  onSuccess?: (updated: Opportunity) => void
}

const typeLabels: Record<OpportunityType, string> = {
  internship: "Internship",
  full_time: "Full-time",
  research: "Research",
  fellowship: "Fellowship",
  scholarship: "Scholarship",
}

const parseRelevantMajors = (
  value: Opportunity["relevant_majors"]
): string[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.filter((major): major is string => typeof major === "string")
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (major): major is string => typeof major === "string"
        )
      }
      return value
        .split(",")
        .map((major) => major.trim())
        .filter(Boolean)
    } catch {
      return value
        .split(",")
        .map((major) => major.trim())
        .filter(Boolean)
    }
  }
  return []
}

const formatDateInputValue = (value: string | null) => {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString().split("T")[0] ?? ""
}

const getDefaultValues = (
  opportunity: Opportunity | null
): EditOpportunityFormData => ({
  company_name: opportunity?.company_name ?? "",
  job_title: opportunity?.job_title ?? "",
  opportunity_type:
    (opportunity?.opportunity_type as OpportunityType) ?? "internship",
  status: (opportunity?.status as "active" | "expired") ?? "active",
  deadline: formatDateInputValue(opportunity?.deadline ?? null),
  description: opportunity?.description ?? "",
  requirements: opportunity?.requirements ?? "",
  location: opportunity?.location ?? "",
  role_type: opportunity?.role_type ?? "",
  relevant_majors: parseRelevantMajors(opportunity?.relevant_majors ?? null),
})

const dedupeMajors = (values: string[]) => {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  )
}

export default function EditOpportunityModal({
  open,
  opportunity,
  onOpenChange,
  onSuccess,
}: EditOpportunityModalProps) {
  const [majorInput, setMajorInput] = useState("")
  const updateOpportunity = useUpdateOpportunity()

  const {
    register,
    control,
    reset,
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<EditOpportunityFormData>({
    resolver: zodResolver(editOpportunitySchema),
    mode: "onChange",
    defaultValues: getDefaultValues(opportunity),
  })

  const watchedMajors = watch("relevant_majors")
  const isSubmitting = updateOpportunity.isPending

  useEffect(() => {
    reset(getDefaultValues(opportunity))
    setMajorInput("")
  }, [opportunity, reset])

  const handleAddMajor = (value: string) => {
    const normalized = value.trim()
    if (!normalized) return
    const updated = dedupeMajors([...(watchedMajors ?? []), normalized])
    setValue("relevant_majors", updated, {
      shouldValidate: true,
      shouldDirty: true,
    })
    setMajorInput("")
  }

  const handleRemoveMajor = (value: string) => {
    const updated = (watchedMajors ?? []).filter(
      (major) => major.toLowerCase() !== value.toLowerCase()
    )
    setValue("relevant_majors", updated, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  const onSubmit = async (data: EditOpportunityFormData) => {
    if (!opportunity) return

    try {
      // Use optimistic update mutation
      const updated = await updateOpportunity.mutateAsync({
        id: opportunity.id,
        data,
      })

      onSuccess?.(updated)
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error("Update failed:", error)
    }
  }

  const handleMajorInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      handleAddMajor(majorInput)
    }
  }

  const majorSuggestions = useMemo(() => MAJORS, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Opportunity</DialogTitle>
          <DialogDescription>
            Update the opportunity details below. All fields are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company name</Label>
              <Input
                id="company_name"
                {...register("company_name")}
                disabled={isSubmitting}
              />
              {errors.company_name && (
                <p className="text-sm text-red-600">
                  {errors.company_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job title</Label>
              <Input
                id="job_title"
                {...register("job_title")}
                disabled={isSubmitting}
              />
              {errors.job_title && (
                <p className="text-sm text-red-600">
                  {errors.job_title.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Opportunity type</Label>
              <Controller
                name="opportunity_type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPPORTUNITY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {typeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.opportunity_type && (
                <p className="text-sm text-red-600">
                  {errors.opportunity_type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="text-sm text-red-600">
                  {errors.status.message}
                </p>
              )}
            </div>
          </div>

  <div className="grid gap-4 md:grid-cols-2">
    <div className="space-y-2">
      <Label htmlFor="deadline">Deadline</Label>
      <Input
        id="deadline"
        type="date"
        {...register("deadline")}
        disabled={isSubmitting}
      />
      {errors.deadline && (
        <p className="text-sm text-red-600">
          {errors.deadline.message}
        </p>
      )}
    </div>
    <div className="space-y-2">
      <Label htmlFor="role_type">Role type</Label>
      <Input
        id="role_type"
        placeholder="e.g. Software Engineering"
        list="role-type-suggestions"
        {...register("role_type")}
        disabled={isSubmitting}
      />
      <datalist id="role-type-suggestions">
        {ROLE_TYPES.map((role) => (
          <option key={role} value={role} />
        ))}
      </datalist>
      {errors.role_type && (
        <p className="text-sm text-red-600">
          {errors.role_type.message}
        </p>
      )}
    </div>
  </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...register("location")}
              disabled={isSubmitting}
            />
            {errors.location && (
              <p className="text-sm text-red-600">
                {errors.location.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <textarea
              id="requirements"
              className="min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
              {...register("requirements")}
              disabled={isSubmitting}
            />
            {errors.requirements && (
              <p className="text-sm text-red-600">
                {errors.requirements.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="min-h-[120px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
              {...register("description")}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="majorInput">Relevant majors</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="majorInput"
                placeholder="Add a major and press Enter"
                value={majorInput}
                onChange={(event) => setMajorInput(event.target.value)}
                onKeyDown={handleMajorInputKeyDown}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddMajor(majorInput)}
                disabled={isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Major
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Press Enter or click “Add” to include a major. Click on a tag to
              remove it.
            </p>

            {watchedMajors && watchedMajors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {watchedMajors.map((major) => (
                  <button
                    type="button"
                    key={major}
                    onClick={() => handleRemoveMajor(major)}
                    className="group inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 transition hover:bg-purple-200"
                  >
                    {major}
                    <span className="text-purple-500 group-hover:text-purple-800">
                      ×
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500">
                Quick suggestions
              </p>
              <div className="flex flex-wrap gap-2">
                {majorSuggestions.map((major) => {
                  const isSelected =
                    watchedMajors?.some(
                      (item) => item.toLowerCase() === major.toLowerCase()
                    ) ?? false
                  return (
                    <button
                      type="button"
                      key={major}
                      onClick={() => handleAddMajor(major)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        isSelected
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-purple-200"
                      }`}
                      disabled={isSubmitting}
                    >
                      {major}
                    </button>
                  )
                })}
              </div>
            </div>

            {errors.relevant_majors && (
              <p className="text-sm text-red-600">
                {errors.relevant_majors.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
