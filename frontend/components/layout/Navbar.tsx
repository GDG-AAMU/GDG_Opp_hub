"use client"

import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import ProfileDropdown from "./ProfileDropdown"
import { ThemeToggle } from "@/components/theme/ThemeToggle"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loading } = useAuth()

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm relative">
      {/* Colorful gradient line at the top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-blue-500 via-green-500 to-yellow-500"></div>
      
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
              <Image
                src="/assets/gdg_logo.png"
                alt="GDG Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              <span className="hidden sm:inline">GDG Opportunities Hub</span>
              <span className="sm:hidden">GDG Hub</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-4 items-center">
            <ThemeToggle />
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-foreground hover:text-purple-600 font-medium transition-colors duration-200"
                >
                  Dashboard
                </Link>
                <ProfileDropdown />
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="px-4 py-2 text-foreground hover:text-purple-600 font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-foreground hover:text-purple-600 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-border pt-4 animate-fade-in">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-foreground hover:text-purple-600 hover:bg-accent rounded-lg font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-foreground hover:text-purple-600 hover:bg-accent rounded-lg font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-foreground hover:text-purple-600 hover:bg-accent rounded-lg font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2 text-foreground hover:text-purple-600 hover:bg-accent rounded-lg font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold text-center hover:shadow-lg transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
