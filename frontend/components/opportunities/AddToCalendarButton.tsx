'use client'

import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadICSFile } from '@/lib/calendar/ics-generator'
import toast from 'react-hot-toast'

interface AddToCalendarButtonProps {
  opportunity: {
    id: string
    company_name: string
    job_title: string
    deadline: string | null
    location?: string | null
    url?: string | null
  }
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  className?: string
}

export default function AddToCalendarButton({
  opportunity,
  variant = 'outline',
  size = 'sm',
  className = ''
}: AddToCalendarButtonProps) {
  const handleAddToCalendar = () => {
    if (!opportunity.deadline) {
      toast.error('This opportunity does not have a deadline')
      return
    }

    try {
      downloadICSFile({
        id: opportunity.id,
        company_name: opportunity.company_name,
        job_title: opportunity.job_title,
        deadline: opportunity.deadline,
        location: opportunity.location || null,
        url: opportunity.url || null
      })
      toast.success('Calendar event added!')
    } catch (error) {
      console.error('Error adding to calendar:', error)
      toast.error('Failed to add to calendar')
    }
  }

  if (!opportunity.deadline) {
    return null
  }

  return (
    <Button
      onClick={handleAddToCalendar}
      variant={variant}
      size={size}
      className={`flex items-center gap-1.5 ${className}`}
      title="Add deadline to calendar"
    >
      <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="hidden sm:inline">Add to Calendar</span>
    </Button>
  )
}

