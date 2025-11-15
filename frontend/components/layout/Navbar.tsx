export default function Navbar() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">GDG Opportunities Hub</h1>
          <div className="flex gap-4">
            <a href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </a>
            <a href="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

