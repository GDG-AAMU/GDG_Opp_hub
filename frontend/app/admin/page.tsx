"use client"

import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import PageHeader from "@/components/layout/PageHeader"
import AdminPanel from "@/components/admin/AdminPanel"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHeader title="Admin Panel" showBackButton={false} />
      <div className="container mx-auto px-4 py-10">
        <AdminPanel />
      </div>
      <Footer />
    </div>
  )
}
