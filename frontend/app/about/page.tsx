"use client"

import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { Linkedin, Github, Users, Lightbulb, Rocket, ExternalLink, Mail, Calendar } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

// Developer data
const developers = [
  {
    name: "Solomon Agyire",
    major: "Computer Science",
    linkedin: "https://www.linkedin.com/in/solomon-agyire/",
    github: "https://github.com/SolomonAgyire",
    image: "/assets/SolomonPic.jpeg",
    role: "PM & Fullstack Developer",
  },
  {
    name: "Goodluck Badewole",
    major: "Computer Science",
    linkedin: "https://www.linkedin.com/in/goodluck-badewole",
    github: "https://github.com/Goodluck07",
    image: "/assets/Goodluck.png",
    role: "Frontend Developer",
  },
  {
    name: "Tatenda Joseph",
    major: "Electrical Engineering",
    linkedin: "https://www.linkedin.com/in/tatenda-joseph",
    github: "https://github.com/tatendajoes",
    image: "/assets/Tatenda.jpeg",
    role: "Fullstack",
  },
  {
    name: "Zizwe Mtonga",
    major: "Computer Science",
    linkedin: "https://www.linkedin.com/in/zizwe-mtonga",
    github: "https://github.com/zizwe27",
    image: "/assets/Zizwe.jpeg",
    role: "Design and Frontend",
  },
  {
    name: "Mercy Akinyemi",
    major: "Computer Science",
    linkedin: "https://www.linkedin.com/in/mercyakinyemi",
    github: "https://github.com/Fis-ayo",
    image: "/assets/Mercy.jpeg",
    role: "Fullstack Developer",
  },
  {
    name: "Thabo Ibrahim Traore",
    major: "Computer Science",
    linkedin: "https://www.linkedin.com/in/thabo-traore/",
    github: "https://github.com/Ibrahim-t39",
    image: "/assets/Ibrahim.png",
    role: "Backend Developer",
  },
  {
    name: "Sunday Ochigbo",
    major: "Electrical Engineering",
    linkedin: "https://www.linkedin.com/in/sunday-ochigbo-a9b018240/",
    github: "https://github.com/sunday004/",
    image: "/assets/Sunday.jpeg",
    role: "Backend Developer",
  },
  {
    name: "Terry Miller",
    major: "Faculty",
    linkedin: "https://www.linkedin.com/in/terrymiller16/",
    github: "",
    email: "terry.miller@aamu.edu",
    image: "/assets/Terry.jpg",
    role: "Faculty Advisor",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* About Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background via-purple-50/30 dark:via-purple-900/10 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-gradient-to-br from-card via-purple-50/50 dark:via-purple-900/20 to-card rounded-2xl shadow-xl p-10 md:p-16 border-2 border-purple-200 dark:border-purple-800 mb-12 relative overflow-hidden"
            >
              {/* Decorative gradient overlay */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl -z-0"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -z-0"></div>
              
              <div className="relative z-10">
                <div className="inline-block mb-6">
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Welcome to GDG AAMU
                  </h2>
                </div>
                <div className="space-y-6 text-muted-foreground text-lg md:text-xl leading-relaxed">
                  <p className="text-foreground/90">
                    Google Developer Group (GDG) are community groups for college and university 
                    students interested in Google developer technologies. Students from all 
                    undergraduate or graduate programs with an interest in growing as a developer 
                    are welcome. By joining a GDG, students grow their knowledge in a peer-to-peer 
                    learning environment and build solutions for local businesses and their community.
                  </p>
                  <p className="text-foreground/90">
                    At the Alabama A&M University Chapter, we are looking forward to having you as 
                    a member, the wonderful contributions you will make, amazing experiences you will 
                    have, and the wonderful technology you will develop.
                  </p>
                  <p className="text-foreground/90">
                    Kindly reach out to us and join our community through the icons provided on this 
                    page, fill out our registration form so we can know about you and we look forward 
                    to having you!
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Mission & Values */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl shadow-lg p-8 border-2 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <Lightbulb className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Our Mission</h3>
                </div>
                <p className="text-foreground/80 text-base md:text-lg leading-relaxed">
                  To empower students with the knowledge, skills, and network needed to excel in 
                  technology careers and contribute to the global tech community through peer-to-peer 
                  learning and real-world projects.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl shadow-lg p-8 border-2 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Rocket className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">What We Do</h3>
                </div>
                <p className="text-foreground/80 text-base md:text-lg leading-relaxed">
                  We organize workshops, hackathons, tech talks, and collaborative projects that 
                  help students build solutions for local businesses and their community while 
                  growing as developers.
                </p>
              </motion.div>
            </div>

            {/* Join CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 rounded-2xl shadow-2xl p-10 md:p-12 text-center text-white relative overflow-hidden"
            >
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 opacity-50 animate-pulse"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                  Ready to Join Our Community?
                </h3>
                  <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-3xl mx-auto">
                    Connect with us and become part of the GDG AAMU family. We&apos;re excited to have you!
                  </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="https://gdg.community.dev/gdg-on-campus-alabama-am-university-huntsville-united-states/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 hover:bg-purple-50 font-semibold text-base px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-white/80 hover:border-purple-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Join GDG AAMU Chapter
                  </a>
                  <Link 
                    href="/signup" 
                    className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-base px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-white/80 hover:border-blue-200"
                  >
                    <Users className="w-4 h-4" />
                    Sign Up for Opportunities Hub
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Developers Section */}
      {developers.length > 0 && (
        <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center mb-12"
              >
                <div className="inline-flex items-center gap-3 mb-4">
                  <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                    Meet the Developers
                  </h2>
                </div>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  The talented team behind GDG Opportunities Hub
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 justify-items-center">
                {developers.map((developer, index) => {
                  // Cycle through Google colors (red, green, blue, yellow) for variety
                  const colorVariants = [
                    'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10',
                    'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10',
                    'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10',
                    'bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10',
                    'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-900/10',
                    'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-900/10',
                  ]
                  const bgColor = colorVariants[index % colorVariants.length]
                  
                  return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 20px 40px rgba(139, 92, 246, 0.3)"
                    }}
                    className={`${bgColor} rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-4 md:p-5 border-2 border-purple-200 dark:border-border text-center group transform hover:-translate-y-2 hover:border-purple-400 dark:hover:border-purple-700`}
                  >
                    {/* Profile Picture */}
                    <div className="relative w-32 h-32 md:w-36 md:h-36 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 p-1.5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                        <div className="w-full h-full rounded-full bg-background p-1.5 overflow-hidden">
                          <Image
                            src={developer.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${developer.name}`}
                            alt={developer.name}
                            width={160}
                            height={160}
                            className="w-full h-full rounded-full object-cover transition-transform duration-300"
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              const target = e.target as HTMLImageElement
                              target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${developer.name}`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="text-lg md:text-xl font-bold text-foreground mb-1">
                      {developer.name}
                    </h3>

                    {/* Role (if provided) */}
                    {developer.role && (
                      <p className="text-xs md:text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">
                        {developer.role}
                      </p>
                    )}

                    {/* Major */}
                    <p className="text-muted-foreground mb-3 text-xs md:text-sm">
                      {developer.major}
                    </p>

                    {/* Social Links */}
                    <div className="flex flex-row gap-2 justify-center flex-wrap">
                      {developer.linkedin && (
                        <a
                          href={developer.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold text-xs transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                          LinkedIn
                        </a>
                      )}
                      {developer.github && (
                        <a
                          href={developer.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-lg font-semibold text-xs transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Github className="w-3.5 h-3.5" />
                          GitHub
                        </a>
                      )}
                      {developer.email && (
                        <a
                          href={`mailto:${developer.email}`}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold text-xs transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Email
                        </a>
                      )}
                    </div>
                  </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background to-purple-50/30 dark:to-purple-900/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-gradient-to-br from-card via-purple-50/50 dark:via-purple-900/20 to-blue-50/50 dark:to-blue-900/20 rounded-2xl shadow-xl p-10 md:p-16 border-2 border-purple-200 dark:border-purple-800 relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-400/30 to-blue-400/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-400/30 to-purple-400/30 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-12 text-center">
                  Chapter Highlights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center p-6 bg-white/50 dark:bg-white/5 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all">
                    <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-3">
                      321+
                    </div>
                    <div className="text-foreground font-semibold text-lg">
                      Group Members
                    </div>
                  </div>
                  <div className="text-center p-6 bg-white/50 dark:bg-white/5 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all">
                    <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">
                      8
                    </div>
                    <div className="text-foreground font-semibold text-lg">
                      Active Organizers
                    </div>
                  </div>
                  <div className="text-center p-6 bg-white/50 dark:bg-white/5 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-lg transition-all">
                    <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-3">
                      Active
                    </div>
                    <div className="text-foreground font-semibold text-lg">
                      Community Events
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

