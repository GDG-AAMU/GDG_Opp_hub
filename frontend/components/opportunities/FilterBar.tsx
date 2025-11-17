'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Filter } from 'lucide-react'
import { MAJORS, ROLE_TYPES, type Major, type RoleType } from '@/lib/constants'

type OpportunityType = 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'

interface FilterBarProps {
  readonly selectedTypes: OpportunityType[]
  readonly onFilterChange: (types: OpportunityType[]) => void
  readonly selectedMajors: Major[]
  readonly onMajorChange: (majors: Major[]) => void
  readonly selectedRoles: RoleType[]
  readonly onRoleChange: (roles: RoleType[]) => void
}

const filterOptions = [
  { value: 'internship', label: 'Internship' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'research', label: 'Research' },
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'scholarship', label: 'Scholarship' },
] as const

export default function FilterBar({
  selectedTypes,
  selectedMajors,
  selectedRoles,
  onFilterChange,
  onMajorChange,
  onRoleChange
}: Readonly<FilterBarProps>) {
  const handleToggleType = (type: OpportunityType) => {
    if (selectedTypes.includes(type)) {
      onFilterChange(selectedTypes.filter(t => t !== type))
    } else {
      onFilterChange([...selectedTypes, type])
    }
  }

  const handleToggleMajor = (major: Major) => {
    if (selectedMajors.includes(major)) {
      onMajorChange(selectedMajors.filter(m => m !== major))
    } else {
      onMajorChange([...selectedMajors, major])
    }
  }

  const handleToggleRole = (role: RoleType) => {
    if (selectedRoles.includes(role)) {
      onRoleChange(selectedRoles.filter(r => r !== role))
    } else {
      onRoleChange([...selectedRoles, role])
    }
  }

  const handleClearFilters = () => {
    onFilterChange([])
    onMajorChange([])
    onRoleChange([])
  }

  const handleSelectAllTypes = () => {
    onFilterChange(filterOptions.map(opt => opt.value as OpportunityType))
  }

  const isTypeSelected = (type: OpportunityType) => selectedTypes.includes(type)
  const isMajorSelected = (major: Major) => selectedMajors.includes(major)
  const isRoleSelected = (role: RoleType) => selectedRoles.includes(role)

  const allTypesSelected = selectedTypes.length === filterOptions.length
  const noTypesSelected = selectedTypes.length === 0
  const someTypesSelected = selectedTypes.length > 0 && !allTypesSelected
  const hasMajorFilters = selectedMajors.length > 0
  const hasRoleFilters = selectedRoles.length > 0
  const hasActiveFilters = selectedTypes.length > 0 || hasMajorFilters || hasRoleFilters

  const getAllButtonLabel = () => {
    if (noTypesSelected || allTypesSelected) return 'All'
    return 'Select All'
  }

  const getAllButtonAriaLabel = () => {
    if (noTypesSelected) return 'Show all opportunity types'
    if (allTypesSelected) return 'Clear type filters'
    return 'Select all opportunity types'
  }

  const handleAllButtonClick = () => {
    if (someTypesSelected) {
      handleSelectAllTypes()
    } else {
      onFilterChange([])
    }
  }

  const allButtonLabel = getAllButtonLabel()
  const allButtonAriaLabel = getAllButtonAriaLabel()

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const activeFilterCount = selectedTypes.length + selectedMajors.length + selectedRoles.length

  // Render filter content (used in both mobile modal and desktop view)
  const renderFilterContent = () => (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Filter by Type {selectedTypes.length > 0 && `(${selectedTypes.length})`}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={allTypesSelected || noTypesSelected ? 'default' : 'outline'}
            size="sm"
            onClick={handleAllButtonClick}
            aria-pressed={allTypesSelected || noTypesSelected}
            aria-label={allButtonAriaLabel}
            className={`
              transition-all duration-200
              ${allTypesSelected || noTypesSelected ? 'shadow-md' : 'hover:border-purple-300'}
            `}
          >
            {allButtonLabel}
          </Button>

          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={isTypeSelected(option.value as OpportunityType) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToggleType(option.value as OpportunityType)}
              aria-pressed={isTypeSelected(option.value as OpportunityType)}
              aria-label={`${isTypeSelected(option.value as OpportunityType) ? 'Remove' : 'Add'} ${option.label} filter`}
              className={`
                transition-all duration-200
                ${isTypeSelected(option.value as OpportunityType) ? 'shadow-md' : 'hover:border-purple-300'}
              `}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 my-1" />

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Filter by Major {selectedMajors.length > 0 && `(${selectedMajors.length})`}
          </h3>
          {hasMajorFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMajorChange([])}
              aria-label="Clear major filters"
              className="text-gray-600 hover:text-purple-600"
            >
              Clear majors
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {MAJORS.map((major) => (
            <Button
              key={major}
              variant={isMajorSelected(major) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToggleMajor(major)}
              aria-pressed={isMajorSelected(major)}
              aria-label={`${isMajorSelected(major) ? 'Remove' : 'Add'} ${major} major filter`}
              className={`
                transition-all duration-200
                ${isMajorSelected(major) ? 'shadow-md' : 'hover:border-purple-300'}
              `}
            >
              {major}
            </Button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 my-1" />

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Filter by Role {selectedRoles.length > 0 && `(${selectedRoles.length})`}
          </h3>
          {hasRoleFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRoleChange([])}
              aria-label="Clear role filters"
              className="text-gray-600 hover:text-purple-600"
            >
              Clear roles
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {ROLE_TYPES.map((role) => (
            <Button
              key={role}
              variant={isRoleSelected(role) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToggleRole(role)}
              aria-pressed={isRoleSelected(role)}
              aria-label={`${isRoleSelected(role) ? 'Remove' : 'Add'} ${role} role filter`}
              className={`
                transition-all duration-200
                ${isRoleSelected(role) ? 'shadow-md' : 'hover:border-purple-300'}
              `}
            >
              {role}
            </Button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            aria-label="Clear all filters"
            className="text-gray-600 hover:text-purple-600"
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile Filter Button - visible only on mobile */}
      <div className="md:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setIsMobileFilterOpen(true)}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-purple-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
        </Button>
      </div>

      {/* Mobile Filter Modal */}
      <Dialog open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-1 text-xs font-semibold bg-purple-600 text-white rounded-full">
                  {activeFilterCount} active
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {renderFilterContent()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMobileFilterOpen(false)}
            >
              Close
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={() => {
                  handleClearFilters()
                  setIsMobileFilterOpen(false)
                }}
                className="text-gray-600 hover:text-purple-600"
              >
                Clear All
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Desktop Filter Bar - visible only on desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
        {renderFilterContent()}
      </div>
    </>
  )
}
