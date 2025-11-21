'use client'

import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import FeedbackModal from './FeedbackModal'
import { useAuth } from '@/hooks/useAuth'

export default function FeedbackButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showPulse, setShowPulse] = useState(false)
  const { user } = useAuth()

  // Show pulse animation on first visit
  useEffect(() => {
    const hasSeenFeedback = localStorage.getItem('hasSeenFeedbackButton')
    if (!hasSeenFeedback) {
      setShowPulse(true)
      localStorage.setItem('hasSeenFeedbackButton', 'true')

      // Remove pulse after 5 seconds
      setTimeout(() => {
        setShowPulse(false)
      }, 5000)
    }
  }, [])

  // Only show feedback button if user is authenticated
  if (!user) {
    return null
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsModalOpen(true)}
          className={`
            group relative
            w-14 h-14 sm:w-16 sm:h-16
            bg-gradient-to-br from-purple-600 to-blue-600
            hover:from-purple-700 hover:to-blue-700
            text-white rounded-full
            shadow-lg hover:shadow-xl
            transition-all duration-300
            flex items-center justify-center
            ${showPulse ? 'animate-pulse' : ''}
          `}
          aria-label="Give Feedback"
        >
          <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />

          {/* Tooltip */}
          <div className="
            absolute bottom-full right-0 mb-2
            px-3 py-1.5 bg-gray-900 text-white text-sm
            rounded-md whitespace-nowrap
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            pointer-events-none
          ">
            Give Feedback
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>

          {/* Pulse ring on first visit */}
          {showPulse && (
            <div className="absolute inset-0 rounded-full bg-purple-600 animate-ping opacity-75"></div>
          )}
        </button>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
