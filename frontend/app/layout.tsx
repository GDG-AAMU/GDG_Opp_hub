import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "react-hot-toast"
import { QueryProvider } from "@/providers/QueryProvider"
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GDG Opportunities Hub",
  description: "Discover and submit job opportunities, internships, research positions, fellowships, and scholarships",
  icons: {
    icon: "/assets/gdg_logo.png",
    shortcut: "/assets/gdg_logo.png",
    apple: "/assets/gdg_logo.png",
  },
}

interface RootLayoutProps {
  readonly children: React.ReactNode
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <ThemeProvider defaultTheme="system" storageKey="gdg-theme">
        {children}
        <Toaster position="top-center" />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

