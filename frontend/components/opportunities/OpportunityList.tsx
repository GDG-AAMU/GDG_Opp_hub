"use client"

import { Opportunity } from "@/types"
import OpportunityCard from "./OpportunityCard"

interface OpportunityListProps {
  opportunities: Opportunity[]
}

export default function OpportunityList({ opportunities }: OpportunityListProps) {
  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No opportunities found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {opportunities.map((opportunity) => (
        <OpportunityCard key={opportunity.id} opportunity={opportunity} />
      ))}
    </div>
  )
}

