export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted border-t border-border mt-auto relative overflow-hidden">
      {/* Colorful decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-red-500 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-green-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-yellow-500 rounded-full blur-3xl"></div>
      </div>
      
      {/* Colorful border gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-blue-500 via-green-500 to-yellow-500"></div>
      
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        <div className="text-center">
          {/* Colorful logo/accent */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          </div>
          
          <p className="text-foreground text-xs sm:text-sm font-medium">
            ©{currentYear} GDG Opportunities Hub. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs sm:text-sm mt-2">
            Built by GDG AAMU
          </p>
        </div>
      </div>
    </footer>
  )
}
