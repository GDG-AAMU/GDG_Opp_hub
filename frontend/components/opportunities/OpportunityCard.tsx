'use client'

import { format } from 'date-fns'
import { Calendar, MapPin, Briefcase, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CompanyLogo } from '@/components/ui/CompanyLogo'
import SaveAppliedButtons from './SaveAppliedButtons'
import AddToCalendarButton from './AddToCalendarButton'
import SocialShareButton from './SocialShareButton'

interface OpportunityCardProps {
  readonly opportunity: {
    id: string
    url: string
    company_name: string
    job_title: string
    opportunity_type: 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
    location: string | null
    deadline: string | null
    userStatus?: 'saved' | 'applied' | null
  }
  onStatusChange?: (status: 'saved' | 'applied' | null) => void
}

const typeColors = {
  internship: 'bg-blue-100 text-blue-700',
  full_time: 'bg-green-100 text-green-700',
  research: 'bg-purple-100 text-purple-700',
  fellowship: 'bg-orange-100 text-orange-700',
  scholarship: 'bg-pink-100 text-pink-700',
}

const typeLabels = {
  internship: 'Internship',
  full_time: 'Full-time',
  research: 'Research',
  fellowship: 'Fellowship',
  scholarship: 'Scholarship',
}

export default function OpportunityCard({ opportunity, onStatusChange }: Readonly<OpportunityCardProps>) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-6 border border-gray-200 hover:border-purple-300">
      {/* Company Logo */}
      <CompanyLogo
        companyName={opportunity.company_name}
        url={opportunity.url}
        size={64}
        className="mb-4"
      />

      {/* Company Name */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {opportunity.company_name}
      </h3>

      {/* Job Title */}
      <h4 className="text-md text-gray-700 mb-3">
        {opportunity.job_title}
      </h4>

      {/* Type Badge */}
      <div className="flex items-center mb-2">
        <Briefcase className="w-4 h-4 mr-2 flex-shrink-0 text-gray-600" />
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeColors[opportunity.opportunity_type]}`}>
          {typeLabels[opportunity.opportunity_type]}
        </span>
      </div>

      {/* Location */}
      {opportunity.location && (
        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm">{opportunity.location}</span>
        </div>
      )}

      {/* Deadline - Always show, more prominent */}
      <div className="flex items-center mb-4">
        <Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600" />
        <span className="text-sm font-medium">
          {opportunity.deadline ? (
            <span className="text-gray-900">
              Deadline: {format(new Date(opportunity.deadline), 'MMM dd, yyyy')}
            </span>
          ) : (
            <span className="text-gray-400 italic">No deadline specified</span>
          )}
        </span>
      </div>

      {/* Save/Applied Buttons */}
      <div className="mb-3">
        <SaveAppliedButtons
          opportunityId={opportunity.id}
          currentStatus={opportunity.userStatus || null}
          onStatusChange={onStatusChange}
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {/* Add to Calendar Button */}
          <div className="flex-1">
            <AddToCalendarButton
              opportunity={{
                id: opportunity.id,
                company_name: opportunity.company_name,
                job_title: opportunity.job_title,
                deadline: opportunity.deadline,
                location: opportunity.location,
                url: opportunity.url
              }}
              size="sm"
              className="w-full"
            />
          </div>

          {/* Share Button */}
          <SocialShareButton
            opportunity={{
              opportunity_type: opportunity.opportunity_type,
              job_title: opportunity.job_title,
              company_name: opportunity.company_name
            }}
            pageUrl={typeof window !== 'undefined' ? `${window.location.origin}/opportunities/${opportunity.id}` : ''}
            size="sm"
            className="flex-1"
          />
        </div>

        {/* View Details Button */}
        <Link href={`/opportunities/${opportunity.id}`} className="block">
          <Button variant="outline" className="w-full group">
            <span className="hidden sm:inline">View Details</span>
            <span className="sm:hidden">Details</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  )
}