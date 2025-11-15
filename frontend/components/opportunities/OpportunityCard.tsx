"use client"

import { Opportunity } from "@/types"

interface OpportunityCardProps {
  opportunity: Opportunity
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      <h3 className="font-semibold text-lg">{opportunity.company_name}</h3>
      <p className="text-gray-600">{opportunity.job_title}</p>
      <p className="text-sm text-gray-500 mt-2">
        Deadline: {opportunity.deadline || "No deadline"}
      </p>
    </div>
  )
}

