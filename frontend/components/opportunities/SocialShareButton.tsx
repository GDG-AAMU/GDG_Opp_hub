'use client'

import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface SocialShareButtonProps {
  opportunity: {
    opportunity_type: string
    job_title: string
    company_name: string
  }
  pageUrl: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  className?: string
}

export default function SocialShareButton({
  opportunity,
  pageUrl,
  variant = 'outline',
  size = 'sm',
  className = ''
}: SocialShareButtonProps) {
  const handleShare = async () => {
    try {
      // Try Web Share API first (mobile)
      if (navigator.share && window.innerWidth < 768) {
        try {
          await navigator.share({
            title: `${opportunity.job_title} at ${opportunity.company_name}`,
            text: `Check out this ${opportunity.opportunity_type} opportunity: ${opportunity.job_title} at ${opportunity.company_name}`,
            url: pageUrl
          })
          toast.success('Shared successfully!')
          return
        } catch (err) {
          // User cancelled or Web Share not available, fall through to copy
          if (err instanceof Error && err.name === 'AbortError') {
            return // User cancelled, don't show error
          }
        }
      }

      // Fallback: Copy link to clipboard
      await navigator.clipboard.writeText(pageUrl)
      toast.success('Link copied to clipboard!')
    } catch (err) {
      console.error('Error sharing:', err)
      toast.error('Failed to copy link')
    }
  }

  return (
    <Button
      onClick={handleShare}
      variant={variant}
      size={size}
      className={`flex items-center justify-center gap-1.5 min-w-0 max-w-full ${className}`}
      title="Copy link to share"
    >
      <Share2 className="w-4 h-4 flex-shrink-0" />
      <span className="hidden md:inline text-xs whitespace-nowrap">Share</span>
    </Button>
  )
}

