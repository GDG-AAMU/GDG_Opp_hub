'use client'

import { useCallback, useState } from 'react'
import { Search, X, Loader2, Clock, Sparkles, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchBarProps {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly placeholder?: string
  readonly isLoading?: boolean
  readonly onClear?: () => void
  readonly recentSearches?: string[]
  readonly popularSearches?: string[]
  readonly onSelectSuggestion?: (value: string) => void
  readonly onClearRecent?: () => void
  readonly autocompleteSuggestions?: string[]
  readonly suggestionsLoading?: boolean
  readonly suggestionsError?: string | null
}

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Search opportunities...',
  isLoading = false,
  recentSearches = [],
  popularSearches = [],
  onSelectSuggestion,
  onClearRecent,
  autocompleteSuggestions = [],
  suggestionsLoading = false,
  suggestionsError = null
}: Readonly<SearchBarProps>) {
  const [isFocused, setIsFocused] = useState(false)

  const handleClear = useCallback(() => {
    onChange('')
    onClear?.()
  }, [onChange, onClear])

  const handleSuggestionClick = useCallback((term: string) => {
    onChange(term)
    onSelectSuggestion?.(term)
  }, [onChange, onSelectSuggestion])

  const hasHistory = (recentSearches?.length ?? 0) > 0
  const hasPopular = (popularSearches?.length ?? 0) > 0
  const hasAutocompleteSuggestions = (autocompleteSuggestions?.length ?? 0) > 0
  const showDropdown = isFocused && (hasHistory || hasPopular || hasAutocompleteSuggestions || suggestionsLoading)

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <Input
        type="text"
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 120)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search opportunities"
        className="h-11 w-full rounded-lg border-gray-200 bg-white pl-10 pr-14 text-sm shadow-sm focus-visible:ring-purple-500"
        disabled={isLoading}
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-purple-500" aria-label="Searching" />
        )}
        {value.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          {(suggestionsLoading || hasAutocompleteSuggestions || suggestionsError) && (
            <div className={(hasHistory || hasPopular) ? 'mb-3' : ''}>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggestions
                </div>
                {suggestionsLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" aria-hidden="true" />
                )}
              </div>
              {suggestionsLoading ? (
                <p className="text-xs text-gray-500">Searching...</p>
              ) : hasAutocompleteSuggestions ? (
                <div className="flex flex-col divide-y divide-gray-100">
                  {autocompleteSuggestions.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSuggestionClick(term)}
                      className="flex items-center justify-between px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-purple-50 hover:text-purple-700"
                    >
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              ) : suggestionsError ? (
                <p className="text-xs text-red-500">{suggestionsError}</p>
              ) : null}
            </div>
          )}

          {recentSearches.length > 0 && (
            <div className="mb-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Recent Searches
                </div>
                {onClearRecent && (
                  <button
                    type="button"
                    className="text-[11px] font-medium text-purple-600 hover:text-purple-700"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={onClearRecent}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionClick(term)}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {popularSearches.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Popular Searches
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionClick(term)}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
