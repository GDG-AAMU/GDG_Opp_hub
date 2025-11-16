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

export default function OpportunityCard({ opportunity }: Readonly<OpportunityCardProps>) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-6 border border-gray-200 hover:border-purple-300">
      {/* Company Logo/Icon */}
      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-4">
        <Building2 className="w-8 h-8 text-purple-600" />
      </div>

      {/* Company Name */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {opportunity.company_name}
      </h3>

      {/* Job Title */}
      <h4 className="text-md text-gray-700 mb-4">
        {opportunity.job_title}
      </h4>

      {/* Deadline */}
      {opportunity.deadline && (
        <div className="flex items-center text-gray-600 mb-2">
          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm">
            Deadline: {format(new Date(opportunity.deadline), 'MMM dd, yyyy')}
          </span>
        </div>
      )}

      {/* Type Badge */}
      <div className="flex items-center mb-2">
        <Briefcase className="w-4 h-4 mr-2 flex-shrink-0 text-gray-600" />
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeColors[opportunity.opportunity_type]}`}>
          {typeLabels[opportunity.opportunity_type]}
        </span>
      </div>

      {/* Location */}
      {opportunity.location && (
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm">{opportunity.location}</span>
        </div>
      )}

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