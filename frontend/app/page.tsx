import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import Link from "next/link"
import { 
  Zap, 
  Users, 
  Briefcase, 
  Lightbulb, 
  Beaker, 
  Rocket, 
  Cog,
  ArrowRight
} from "lucide-react"

export default function Home() {
  const stats = [
    { icon: Zap, value: "12,345+", label: "Total Opportunities" },
    { icon: Users, value: "50,000+", label: "Active Users" },
    { icon: Briefcase, value: "15+", label: "Opportunity Types" },
  ]

  const opportunityTypes = [
    { name: "Internships", href: "/dashboard?type=internship" },
    { name: "Full-time", href: "/dashboard?type=full_time" },
    { name: "Research", href: "/dashboard?type=research" },
    { name: "Fellowships", href: "/dashboard?type=fellowship" },
    { name: "Scholarships", href: "/dashboard?type=scholarship" },
  ]

  const featuredOpportunities = [
    {
      id: 1,
      type: "Internships",
      title: "Software Engineering Internship",
      description: "Join our team as a software engineering intern and work on cutting-edge projects. Gain hands-on experience with modern technologies.",
      image: "💻",
    },
    {
      id: 2,
      type: "Internships",
      title: "Electrical Engineering Internship",
      description: "Gain hands-on experience in electrical engineering design, analysis, and manufacturing. Work on real-world projects and collaborate with experienced engineers.",
      image: "⚙️",
    },
    {
      id: 3,
      type: "Research",
      title: "Research Opportunities",
      description: "Explore cutting-edge research opportunities across various scientific fields. Collaborate with leading researchers and contribute to groundbreaking discoveries.",
      image: "🔬",
    },
    {
      id: 4,
      type: "Scholarships",
      title: "Global Leadership Scholarship",
      description: "Merit-based scholarship for outstanding students pursuing leadership roles. Full tuition coverage and mentorship program.",
      image: "🎓",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative w-full bg-gradient-to-r from-purple-800 via-purple-700 to-blue-800 dark:from-purple-900/30 dark:via-purple-800/30 dark:to-blue-900/30 text-white dark:text-foreground overflow-hidden">
        {/* Colorful gradient border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-blue-500 via-green-500 to-yellow-500 z-20"></div>
        
        <div className="hidden md:block absolute inset-0 opacity-10 dark:opacity-5">
          <div className="absolute top-20 right-20 w-24 h-24">
            <Lightbulb className="w-full h-full" />
          </div>
          <div className="absolute top-40 right-40 w-16 h-16">
            <Beaker className="w-full h-full" />
          </div>
          <div className="absolute bottom-20 right-32 w-20 h-20">
            <Rocket className="w-full h-full" />
          </div>
          <div className="absolute bottom-32 right-52 w-14 h-14">
            <Cog className="w-full h-full" />
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24 lg:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight px-2">
              Discover Your Next Opportunity
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-purple-200 dark:text-muted-foreground max-w-2xl mx-auto px-4">
              Explore internships, research roles, fellowships, and scholarships all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2 sm:pt-4 px-4">
              <Link 
                href="/dashboard"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/90 dark:bg-white/90 text-purple-700 dark:text-purple-700 font-semibold rounded-lg hover:bg-white dark:hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base border border-purple-600 dark:border-purple-400"
              >
                Browse Opportunities
              </Link>
              <Link 
                href="/dashboard"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border border-purple-600 dark:border-purple-400 text-white dark:text-foreground font-semibold rounded-lg hover:bg-white/10 dark:hover:bg-accent/50 hover:border-purple-500 dark:hover:border-purple-300 transition-all duration-300 text-sm sm:text-base"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 sm:mb-12 text-foreground px-4">
            Key Highlights
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className="bg-card rounded-xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center border border-border"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-4">
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground text-base sm:text-lg">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Explore Categories Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 sm:mb-12 text-foreground px-4">
            Explore Categories
          </h2>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl mx-auto px-2">
            {opportunityTypes.map((type, index) => (
              <Link
                key={index}
                href={type.href}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 ${
                  index === 0
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-card text-foreground border-2 border-border hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                } hover:scale-105 active:scale-95`}
              >
                {type.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Opportunities Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 sm:mb-12 text-foreground px-4">
            Featured Opportunities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {featuredOpportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className="bg-card rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group border border-border"
              >
                {/* Placeholder image area */}
                <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center text-5xl sm:text-6xl">
                  {opportunity.image}
                </div>
                <div className="p-4 sm:p-6">
                  <span className="inline-block px-2 sm:px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs sm:text-sm font-semibold rounded-full mb-3">
                    {opportunity.type}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {opportunity.title}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base line-clamp-3">
                    {opportunity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
