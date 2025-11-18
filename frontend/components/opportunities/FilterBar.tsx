'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, X } from 'lucide-react'
import { MAJORS, ROLE_TYPES, type Major, type RoleType } from '@/lib/constants'

type OpportunityType = 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
type SponsorshipFilter = 'any' | 'offers' | 'no-offers'
type CitizenshipFilter = 'any' | 'required' | 'not-required'

interface FilterBarProps {
  readonly selectedTypes: OpportunityType[]
  readonly onFilterChange: (types: OpportunityType[]) => void
  readonly selectedMajors: Major[]
  readonly onMajorChange: (majors: Major[]) => void
  readonly selectedRoles: RoleType[]
  readonly onRoleChange: (roles: RoleType[]) => void
  readonly selectedSponsorship: SponsorshipFilter
  readonly onSponsorshipChange: (sponsorship: SponsorshipFilter) => void
  readonly selectedCitizenship: CitizenshipFilter
  readonly onCitizenshipChange: (citizenship: CitizenshipFilter) => void
}

const TYPE_OPTIONS = [
  { value: 'internship', label: 'Internship' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'research', label: 'Research' },
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'scholarship', label: 'Scholarship' },
] as const

const SPONSORSHIP_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'offers', label: 'Offers Sponsorship' },
  { value: 'no-offers', label: 'Does NOT Offer' },
] as const

const CITIZENSHIP_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'required', label: 'Required' },
  { value: 'not-required', label: 'Not Required' },
] as const

export default function FilterBar({
  selectedTypes,
  selectedMajors,
  selectedRoles,
  selectedSponsorship,
  selectedCitizenship,
  onFilterChange,
  onMajorChange,
  onRoleChange,
  onSponsorshipChange,
  onCitizenshipChange
}: Readonly<FilterBarProps>) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const typeRef = useRef<HTMLDivElement>(null)
  const majorRef = useRef<HTMLDivElement>(null)
  const roleRef = useRef<HTMLDivElement>(null)
  const sponsorshipRef = useRef<HTMLDivElement>(null)
  const citizenshipRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const refs = [typeRef, majorRef, roleRef, sponsorshipRef, citizenshipRef]
      const clickedOutside = refs.every(ref =>
        ref.current && !ref.current.contains(event.target as Node)
      )
      if (clickedOutside) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown)
  }

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
    onSponsorshipChange('any')
    onCitizenshipChange('any')
  }

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedMajors.length > 0 ||
    selectedRoles.length > 0 ||
    selectedSponsorship !== 'any' ||
    selectedCitizenship !== 'any'

  const getTypeLabel = () => {
    if (selectedTypes.length === 0) return 'Type'
    if (selectedTypes.length === 1) {
      const type = TYPE_OPTIONS.find(opt => opt.value === selectedTypes[0])
      return type?.label || 'Type'
    }
    return `Type (${selectedTypes.length})`
  }

  const getMajorLabel = () => {
    if (selectedMajors.length === 0) return 'Major'
    if (selectedMajors.length === 1) return selectedMajors[0]
    return `Major (${selectedMajors.length})`
  }

  const getRoleLabel = () => {
    if (selectedRoles.length === 0) return 'Role'
    if (selectedRoles.length === 1) return selectedRoles[0]
    return `Role (${selectedRoles.length})`
  }

  const getSponsorshipLabel = () => {
    const option = SPONSORSHIP_OPTIONS.find(opt => opt.value === selectedSponsorship)
    return option?.label || 'Visa Sponsorship'
  }

  const getCitizenshipLabel = () => {
    const option = CITIZENSHIP_OPTIONS.find(opt => opt.value === selectedCitizenship)
    return option?.label || 'U.S. Citizenship'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Filter By Label */}
        <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
          Filter by:
        </span>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Type Filter */}
          <div className="relative" ref={typeRef}>
            <button
              onClick={() => toggleDropdown('type')}
              className={`
                inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border
                transition-all duration-200
                ${selectedTypes.length > 0
                  ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {getTypeLabel()}
              <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'type' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'type' && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(option.value as OpportunityType)}
                      onChange={() => handleToggleType(option.value as OpportunityType)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Major Filter */}
          <div className="relative" ref={majorRef}>
            <button
              onClick={() => toggleDropdown('major')}
              className={`
                inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border
                transition-all duration-200
                ${selectedMajors.length > 0
                  ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {getMajorLabel()}
              <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'major' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'major' && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
                {MAJORS.map((major) => (
                  <label
                    key={major}
                    className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMajors.includes(major)}
                      onChange={() => handleToggleMajor(major)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">{major}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Role Filter */}
          <div className="relative" ref={roleRef}>
            <button
              onClick={() => toggleDropdown('role')}
              className={`
                inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border
                transition-all duration-200
                ${selectedRoles.length > 0
                  ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {getRoleLabel()}
              <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'role' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'role' && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
                {ROLE_TYPES.map((role) => (
                  <label
                    key={role}
                    className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => handleToggleRole(role)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">{role}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Visa Sponsorship Filter */}
          <div className="relative" ref={sponsorshipRef}>
            <button
              onClick={() => toggleDropdown('sponsorship')}
              className={`
                inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border
                transition-all duration-200
                ${selectedSponsorship !== 'any'
                  ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              Visa Sponsorship
              <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'sponsorship' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'sponsorship' && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {SPONSORSHIP_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="sponsorship"
                      checked={selectedSponsorship === option.value}
                      onChange={() => onSponsorshipChange(option.value as SponsorshipFilter)}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* U.S. Citizenship Filter */}
          <div className="relative" ref={citizenshipRef}>
            <button
              onClick={() => toggleDropdown('citizenship')}
              className={`
                inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border
                transition-all duration-200
                ${selectedCitizenship !== 'any'
                  ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              U.S. Citizenship
              <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'citizenship' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'citizenship' && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {CITIZENSHIP_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="citizenship"
                      checked={selectedCitizenship === option.value}
                      onChange={() => onCitizenshipChange(option.value as CitizenshipFilter)}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-gray-600 hover:text-purple-600 flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {selectedTypes.map((type) => {
              const option = TYPE_OPTIONS.find(opt => opt.value === type)
              return (
                <span
                  key={type}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full"
                >
                  {option?.label}
                  <button
                    onClick={() => handleToggleType(type)}
                    className="hover:text-purple-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })}

            {selectedMajors.map((major) => (
              <span
                key={major}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full"
              >
                {major}
                <button
                  onClick={() => handleToggleMajor(major)}
                  className="hover:text-purple-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {selectedRoles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full"
              >
                {role}
                <button
                  onClick={() => handleToggleRole(role)}
                  className="hover:text-purple-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {selectedSponsorship !== 'any' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                {getSponsorshipLabel()}
                <button
                  onClick={() => onSponsorshipChange('any')}
                  className="hover:text-purple-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedCitizenship !== 'any' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                {getCitizenshipLabel()}
                <button
                  onClick={() => onCitizenshipChange('any')}
                  className="hover:text-purple-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
