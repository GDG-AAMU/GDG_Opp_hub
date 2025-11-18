'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfileDropdown() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
          event.preventDefault()
          setIsOpen(true)
          setFocusedIndex(0)
        }
        return
      }

      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          setIsOpen(false)
          setFocusedIndex(-1)
          buttonRef.current?.focus()
          break
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => {
            const next = prev < menuItemsRef.current.length - 1 ? prev + 1 : 0
            menuItemsRef.current[next]?.focus()
            return next
          })
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => {
            const next = prev > 0 ? prev - 1 : menuItemsRef.current.length - 1
            menuItemsRef.current[next]?.focus()
            return next
          })
          break
        case 'Home':
          event.preventDefault()
          setFocusedIndex(0)
          menuItemsRef.current[0]?.focus()
          break
        case 'End':
          event.preventDefault()
          const lastIndex = menuItemsRef.current.length - 1
          setFocusedIndex(lastIndex)
          menuItemsRef.current[lastIndex]?.focus()
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully!')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || 'Failed to log out')
    }
  }

  const navigateToProfile = () => {
    setIsOpen(false)
    router.push('/profile')
  }

  const navigateToSettings = () => {
    setIsOpen(false)
    router.push('/settings')
  }

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user?.email) return 'U'
    const email = user.email
    return email.charAt(0).toUpperCase()
  }

  const menuItems = [
    { label: 'Your Profile', icon: User, onClick: navigateToProfile },
    { label: 'Settings', icon: Settings, onClick: navigateToSettings },
    { label: 'Log out', icon: LogOut, onClick: handleLogout, isDestructive: true },
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setFocusedIndex(0)
          }
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
          {getInitials()}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-popover rounded-lg shadow-lg border border-border py-1 z-50"
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-popover-foreground truncate">{user?.email}</p>
          </div>

          {/* Menu Items */}
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                ref={(el: HTMLButtonElement | null) => { menuItemsRef.current[index] = el }}
                onClick={item.onClick}
                role="menuitem"
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  item.isDestructive
                    ? 'text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20'
                    : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground'
                } focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset`}
                onFocus={() => setFocusedIndex(index)}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
