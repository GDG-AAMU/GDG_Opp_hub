'use client'

import { ArrowUpDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type SortOption = 
  | 'deadline-asc' 
  | 'deadline-desc' 
  | 'recent' 
  | 'company-asc'

interface SortDropdownProps {
  readonly selectedSort: SortOption
  readonly onSortChange: (sort: SortOption) => void
}

const sortOptions = [
  { value: 'deadline-asc', label: 'Deadline: Closest First' },
  { value: 'deadline-desc', label: 'Deadline: Farthest First' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'company-asc', label: 'Company Name (A-Z)' },
] as const

export default function SortDropdown({ selectedSort, onSortChange }: Readonly<SortDropdownProps>) {
  const currentSortLabel = sortOptions.find(opt => opt.value === selectedSort)?.label

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-gray-600" />
      <span className="text-sm font-semibold text-gray-700">Sort by:</span>
      <Select value={selectedSort} onValueChange={(value) => onSortChange(value as SortOption)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue>{currentSortLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}