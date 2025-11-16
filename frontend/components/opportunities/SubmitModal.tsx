'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Loader2, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { submitOpportunitySchema, SubmitOpportunityFormData } from '@/lib/validations/opportunity'
import { OPPORTUNITY_TYPES } from '@/lib/constants'

interface SubmitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const opportunityTypeLabels: Record<string, string> = {
  internship: 'Internship',
  full_time: 'Full-time',
  research: 'Research',
  fellowship: 'Fellowship',
  scholarship: 'Scholarship',
}

export default function SubmitModal({ open, onOpenChange, onSuccess }: SubmitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SubmitOpportunityFormData>({
    resolver: zodResolver(submitOpportunitySchema),
    defaultValues: {
      url: '',
      company_name: '',
      opportunity_type: undefined,
    },
  })

  const opportunityType = watch('opportunity_type')

  const onSubmit = async (data: SubmitOpportunityFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/opportunities/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 400 && result.details) {
          const errorMessages = result.details.map((d: any) => d.message).join(', ')
          throw new Error(errorMessages || result.error || 'Validation failed')
        }
        throw new Error(result.error || 'Failed to submit opportunity')
      }

      toast.success(result.message || 'Opportunity submitted successfully!')
      reset()
      
      setTimeout(() => {
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        }
      }, 1000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit opportunity'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Submit New Opportunity</DialogTitle>
          <DialogDescription>
            Share an opportunity with the community. Our AI will automatically extract the details from the URL.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* URL Field */}
          <div className="space-y-2">
            <Label htmlFor="url">
              Opportunity URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/job-posting"
              {...register('url')}
              disabled={isSubmitting}
              className={errors.url ? 'border-red-500' : ''}
            />
            {errors.url && (
              <p className="text-sm text-red-600">{errors.url.message}</p>
            )}
          </div>

          {/* Company Name Field (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name (Optional)</Label>
            <Input
              id="company_name"
              type="text"
              placeholder="e.g., Google, Microsoft"
              {...register('company_name')}
              disabled={isSubmitting}
            />
            {errors.company_name && (
              <p className="text-sm text-red-600">{errors.company_name.message}</p>
            )}
          </div>

          {/* Opportunity Type Field */}
          <div className="space-y-2">
            <Label htmlFor="opportunity_type">
              Opportunity Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={opportunityType}
              onValueChange={(value) => setValue('opportunity_type', value as any)}
              disabled={isSubmitting}
            >
              <SelectTrigger 
                id="opportunity_type"
                className={errors.opportunity_type ? 'border-red-500' : ''}
              >
                <SelectValue placeholder="Select opportunity type" />
              </SelectTrigger>
              <SelectContent>
                {OPPORTUNITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {opportunityTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.opportunity_type && (
              <p className="text-sm text-red-600">{errors.opportunity_type.message}</p>
            )}
          </div>

          {/* Loading State Indicator */}
          {isSubmitting && (
            <div className="flex items-center justify-center gap-2 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">
                  Parsing with AI...
                </span>
              </div>
              <p className="text-xs text-purple-700 mt-1">
                This may take 5-10 seconds
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
