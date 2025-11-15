"use client"

import { Opportunity } from "@/types"

interface OpportunityDetailsProps {
  opportunity: Opportunity
}

export default function OpportunityDetails({ opportunity }: OpportunityDetailsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{opportunity.job_title}</h1>
        <p className="text-xl text-gray-600">{opportunity.company_name}</p>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Description</h2>
        <p className="text-gray-700">{opportunity.description}</p>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Requirements</h2>
        <p className="text-gray-700">{opportunity.requirements}</p>
      </div>
    </div>
  )
}

