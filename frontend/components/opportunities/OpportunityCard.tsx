'use client'

import { format } from 'date-fns'
import { Calendar, MapPin, Briefcase, Building2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface OpportunityCardProps {
  readonly opportunity: {
    id: string
    url: string
    company_name: string
    job_title: string
    opportunity_type: 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
    location: string | null
    deadline: string | null
  }
}

const typeColors = {
  internship: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  full_time: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  research: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  fellowship: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  scholarship: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
}

const typeLabels = {
  internship: 'Internship',
  full_time: 'Full-time',
  research: 'Research',
  fellowship: 'Fellowship',
  scholarship: 'Scholarship',
}

export default function OpportunityCard({ opportunity }: Readonly<OpportunityCardProps>) {
  return (
    <div className="bg-card rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-6 border border-border hover:border-purple-500 dark:hover:border-purple-400">
      {/* Company Logo/Icon */}
      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 dark:from-purple-900/30 to-blue-100 dark:to-blue-900/30 rounded-lg mb-4">
        <Building2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
      </div>

      {/* Company Name */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {opportunity.company_name}
      </h3>

      {/* Job Title */}
      <h4 className="text-md text-muted-foreground mb-3">
        {opportunity.job_title}
      </h4>

      {/* Type Badge */}
      <div className="flex items-center mb-2">
        <Briefcase className="w-4 h-4 mr-2 flex-shrink-0 text-muted-foreground" />
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeColors[opportunity.opportunity_type]}`}>
          {typeLabels[opportunity.opportunity_type]}
        </span>
      </div>

      {/* Location */}
      {opportunity.location && (
        <div className="flex items-center text-muted-foreground mb-2">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm">{opportunity.location}</span>
        </div>
      )}

      {/* Deadline - Always show, more prominent */}
      <div className="flex items-center mb-4">
        <Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
        <span className="text-sm font-medium">
          {opportunity.deadline ? (
            <span className="text-foreground">
              Deadline: {format(new Date(opportunity.deadline), 'MMM dd, yyyy')}
            </span>
          ) : (
            <span className="text-muted-foreground italic">No deadline specified</span>
          )}
        </span>
      </div>

      {/* View Details Button */}
      <Link href={`/opportunities/${opportunity.id}`} className="block">
        <Button variant="outline" className="w-full group">
          View Details
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Link>
    </div>
  )
}