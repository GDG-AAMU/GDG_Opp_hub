'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import ProfileDropdown from './ProfileDropdown'

interface PageHeaderProps {
  title?: string
  showBackButton?: boolean
  backButtonLabel?: string
  onBackClick?: () => void
  rightActions?: React.ReactNode
}

export default function PageHeader({
  title,
  showBackButton = true,
  backButtonLabel = 'Back',
  onBackClick,
  rightActions,
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBackClick) {
      onBackClick()
    } else {
      router.back()
    }
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                onClick={handleBack}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-purple-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backButtonLabel}
              </Button>
            )}
            {title && (
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-3">
            {rightActions}
           {/* <ProfileDropdown /> */}
          </div>
        </div>
      </div>
    </div>
  )
}

