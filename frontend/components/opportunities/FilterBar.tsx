'use client'

import { Button } from '@/components/ui/button'

type OpportunityType = 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'

interface FilterBarProps {
  readonly selectedTypes: OpportunityType[]
  readonly onFilterChange: (types: OpportunityType[]) => void
}

const filterOptions = [
  { value: 'internship', label: 'Internship' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'research', label: 'Research' },
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'scholarship', label: 'Scholarship' },
] as const

export default function FilterBar({ selectedTypes, onFilterChange }: Readonly<FilterBarProps>) {
  const handleToggleFilter = (type: OpportunityType) => {
    if (selectedTypes.includes(type)) {
      // Remove the type from selection
      onFilterChange(selectedTypes.filter(t => t !== type))
    } else {
      // Add the type to selection
      onFilterChange([...selectedTypes, type])
    }
  }

  const handleClearFilters = () => {
    onFilterChange([])
  }

  const handleSelectAll = () => {
    onFilterChange(filterOptions.map(opt => opt.value as OpportunityType))
  }

  const isSelected = (type: OpportunityType) => selectedTypes.includes(type)
  const allSelected = selectedTypes.length === filterOptions.length
  const noneSelected = selectedTypes.length === 0
  const someSelected = selectedTypes.length > 0 && !allSelected

  // Determine the label and action for the "All" button
  const getAllButtonLabel = () => {
    if (noneSelected || allSelected) return 'All'
    return 'Select All'
  }

  const getAllButtonAriaLabel = () => {
    if (noneSelected) return 'Show all opportunity types'
    if (allSelected) return 'Clear all filters'
    return 'Select all opportunity types'
  }

  const allButtonLabel = getAllButtonLabel()
  const allButtonAriaLabel = getAllButtonAriaLabel()
  const allButtonAction = noneSelected || allSelected ? handleClearFilters : handleSelectAll

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter Label */}
        <h3 className="text-sm font-semibold text-gray-700">
          Filter by Type {selectedTypes.length > 0 && `(${selectedTypes.length})`}:
        </h3>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* All/Select All Button */}
          <Button
            variant={allSelected || noneSelected ? 'default' : 'outline'}
            size="sm"
            onClick={allButtonAction}
            aria-pressed={allSelected || noneSelected}
            aria-label={allButtonAriaLabel}
            className={`
              transition-all duration-200
              ${allSelected || noneSelected
                ? 'shadow-md'
                : 'hover:border-purple-300'
              }
            `}
          >
            {allButtonLabel}
          </Button>

          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={isSelected(option.value as OpportunityType) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToggleFilter(option.value as OpportunityType)}
              aria-pressed={isSelected(option.value as OpportunityType)}
              aria-label={`${isSelected(option.value as OpportunityType) ? 'Remove' : 'Add'} ${option.label} filter`}
              className={`
                transition-all duration-200
                ${isSelected(option.value as OpportunityType)
                  ? 'shadow-md'
                  : 'hover:border-purple-300'
                }
              `}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Clear Filters Button */}
        {someSelected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            aria-label="Clear all filters"
            className="text-gray-600 hover:text-purple-600"
          >
            Clear All
          </Button>
        )}
      </div>
    </div>
  )
}