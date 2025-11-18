"use client"

import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import PageHeader from "@/components/layout/PageHeader"
import AdminPanel from "@/components/admin/AdminPanel"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />
      <PageHeader title="Admin Panel" showBackButton={false} />
      <div className="container mx-auto px-4 py-10">
        <AdminPanel />
      </div>
      <Footer />
    </div>
  )
}
