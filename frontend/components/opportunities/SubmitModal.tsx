'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'
import { Loader2, Sparkles, Info } from 'lucide-react'
import { useInvalidateOpportunities } from '@/hooks/useOpportunities'
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

// Note: We no longer use hardcoded restricted sites
// The API will try scraping first and detect if blocked dynamically

export default function SubmitModal({ open, onOpenChange, onSuccess }: SubmitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [manualContent, setManualContent] = useState('')
  const [requiresManual, setRequiresManual] = useState(false)
  const invalidateOpportunities = useInvalidateOpportunities()

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
  const url = watch('url')

  // Note: We no longer pre-check for restricted sites
  // The API will try scraping first and return requiresManual if blocked
  // Manual content field will show if user gets requiresManual response

  const onSubmit = async (data: SubmitOpportunityFormData) => {
    // Validate manual content if required
    if (requiresManual && manualContent.trim().length < 50) {
      toast.error('Please paste at least 50 characters of job posting content', { duration: 4000 })
      return
    }

    setIsSubmitting(true)
    try {
      // Include manual content if provided (user can provide it proactively or after being prompted)
      const requestBody: any = { ...data }
      if (manualContent && manualContent.trim().length >= 50) {
        requestBody.manualContent = manualContent.trim()
      }

      const response = await fetch('/api/opportunities/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        // Check if manual content is required
        if (result.requiresManual) {
          setRequiresManual(true)
          const errorMsg = result.message || result.error || 'This site requires manual content paste'
          toast.error(errorMsg, { duration: 5000 })
          setIsSubmitting(false)
          return
        }

        if (response.status === 400 && result.details) {
          const errorMessages = result.details.map((d: any) => d.message).join(', ')
          throw new Error(errorMessages || result.message || result.error || 'Validation failed')
        }
        throw new Error(result.message || result.error || 'Failed to submit opportunity')
      }

      // 🎉 Success! Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#a855f7', '#c084fc', '#e9d5ff'],
      })

      // Show thank you toast
      toast.success('🎉 Thank you for contributing! Your opportunity has been submitted successfully!', {
        duration: 1000,
        style: {
          background: '#9333ea',
          color: '#fff',
          fontWeight: '500',
        },
      })

      // Invalidate opportunities cache to show new submission
      invalidateOpportunities()

      reset()
      setManualContent('')
      setRequiresManual(false)

      setTimeout(() => {
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        }
      }, 1500)

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
      setManualContent('')
      setRequiresManual(false)
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

          {/* Manual Content Field (for restricted sites) */}
          {requiresManual && (
            <div className="space-y-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <Label htmlFor="manualContent" className="text-amber-900 font-semibold">
                    Manual Content Required
                  </Label>
                  <p className="text-sm text-amber-700 mt-1">
                    {url.includes('linkedin.com') 
                      ? 'LinkedIn requires login and blocks automated scraping. Please copy and paste the job description below.'
                      : 'This site cannot be automatically scraped. Please copy and paste the job posting content below.'}
                  </p>
                </div>
              </div>
              <textarea
                id="manualContent"
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="Paste the job description, requirements, location, deadline, and other details here..."
                disabled={isSubmitting}
                rows={8}
                className="w-full px-3 py-2 border border-amber-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              />
              {manualContent.trim().length > 0 && manualContent.trim().length < 50 && (
                <p className="text-xs text-amber-600">
                  Please provide at least 50 characters of content.
                </p>
              )}
            </div>
          )}

          {/* Opportunity Type Field */}
          <div className="space-y-2">
            <Label htmlFor="opportunity_type">
              Opportunity Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={opportunityType}
              onValueChange={(value) => setValue('opportunity_type', value as any, { shouldValidate: true })}
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
