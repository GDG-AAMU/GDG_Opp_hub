'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Building2, CheckCircle2 } from 'lucide-react'
import { getCompanyLogoUrl } from '@/lib/services/logoService'
import { cn } from '@/lib/utils'

interface CompanyLogoProps {
  companyName: string
  url: string
  size?: number
  className?: string
  verified?: boolean
  showVerifiedBadge?: boolean
}

export function CompanyLogo({
  companyName,
  url,
  size = 64,
  className,
  verified = false,
  showVerifiedBadge = false
}: CompanyLogoProps) {
  const [logoError, setLogoError] = useState(false)
  const [loading, setLoading] = useState(true)

  const logoUrl = getCompanyLogoUrl(url, size)

  // Fallback 3: Building icon with gradient background
  const BuildingFallback = () => (
    <div
      className={cn(
        'flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg',
        className
      )}
      style={{ width: size, height: size }}
    >
      <Building2 className="text-purple-600" style={{ width: size / 2, height: size / 2 }} />
    </div>
  )

  // Fallback 2: First letter of company name in colored circle
  const LetterFallback = () => {
    const firstLetter = companyName.charAt(0).toUpperCase()
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
    ]
    // Use company name to consistently select a color
    const colorIndex = companyName.charCodeAt(0) % colors.length

    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br rounded-lg font-bold text-white',
          colors[colorIndex],
          className
        )}
        style={{ width: size, height: size, fontSize: size / 2.5 }}
      >
        {firstLetter}
      </div>
    )
  }

  // If no logo URL could be generated, show letter fallback
  if (!logoUrl) {
    return <LetterFallback />
  }

  // If logo loading failed, show letter fallback
  if (logoError) {
    return <LetterFallback />
  }

  return (
    <div
      className={cn('relative overflow-hidden rounded-lg bg-white', className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={logoUrl}
        alt={`${companyName} logo`}
        width={size}
        height={size}
        className="object-contain p-1"
        onError={() => {
          setLogoError(true)
          setLoading(false)
        }}
        onLoad={() => setLoading(false)}
        unoptimized // Favicon APIs don't support Next.js optimization
      />

      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="animate-pulse">
            <Building2 className="text-gray-300" style={{ width: size / 2, height: size / 2 }} />
          </div>
        </div>
      )}

      {/* Verified badge */}
      {showVerifiedBadge && verified && (
        <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-0.5" title="Logo verified by admin">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  )
}
