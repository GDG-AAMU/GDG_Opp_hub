export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center">
          <p className="text-gray-400 text-xs sm:text-sm">
            ©{currentYear} GDG Opportunities Hub. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            Built by GDG AAMU
          </p>
        </div>
      </div>
    </footer>
  )
}
