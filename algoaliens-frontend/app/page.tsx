import Link from "next/link"
import {
  Braces,
  Code,
  Cpu,
  Database,
  Gift,
  GraduationCap,
  Network,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react"

const featureCards = [
  {
    description:
      "Solve real problems with an in-browser code editor. Debug, optimize, and submit.",
    icon: Terminal,
    iconClassName: "bg-violet-500/15 text-violet-200",
    title: "Interactive Coding Challenges",
  },
  {
    description:
      "Adaptive modules that evolve with your skill level and learning speed.",
    icon: Zap,
    iconClassName: "bg-fuchsia-500/15 text-fuchsia-200",
    title: "AI-Powered Learning Paths",
  },
  {
    description:
      "Certificates that prove real competence and showcase verified skills.",
    icon: ShieldCheck,
    iconClassName: "bg-indigo-500/15 text-indigo-200",
    title: "Skill Verification Certificates",
  },
  {
    description:
      "Build portfolio projects reviewed around practical, job-ready outcomes.",
    icon: Gift,
    iconClassName: "bg-purple-500/15 text-purple-100",
    title: "Real Project Submissions",
  },
] as const

const previewCourses = [
  {
    description: "Debugging tasks",
    icon: Code,
    title: "Data Structures & Algorithms",
  },
  {
    description: "Query correction tasks",
    icon: Database,
    title: "SQL Mastery",
  },
  {
    description: "Scenario analysis",
    icon: Network,
    title: "Computer Networks",
  },
  {
    description: "Debugging + concept checks",
    icon: Cpu,
    title: "Operating Systems",
  },
  {
    description: "Debugging & OOP fixes",
    icon: Braces,
    title: "Java Programming",
  },
  {
    description: "Debugging tasks",
    icon: Terminal,
    title: "Python for DSA",
  },
] as const

export default function Home() {
  return (
    <main className="grid-bg min-h-screen text-white">
      <header className="fixed left-0 top-0 z-50 w-full border-b border-purple-500/10 bg-[rgba(7,3,18,0.82)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-md shadow-purple-950/30">
              <GraduationCap size={18} />
            </div>
            <span className="font-semibold text-white">AlgoAliens</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-gray-300 md:flex">
            <a href="#courses" className="transition hover:text-white">
              Courses
            </a>
            <a href="#about" className="transition hover:text-white">
              About
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm text-gray-300 transition hover:text-white">
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 px-4 py-2 text-sm text-white shadow-md shadow-fuchsia-950/20 transition-all duration-300 hover:scale-[1.02]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-10 pt-32 text-center">
        <span className="rounded-full border border-purple-500/30 px-4 py-1 text-xs text-purple-200">
          Skill Verification Platform
        </span>

        <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">
          Master Algorithms with
          <span className="block text-purple-300">AlgoAliens</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-gray-400">
          Prove your coding skills through real challenges, projects, and skill verification.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 px-6 py-3 text-white shadow-md shadow-fuchsia-950/20 transition-all duration-300 hover:scale-[1.02]"
          >
            Start Learning
          </Link>

          <Link
            href="/courses"
            className="rounded-lg border border-purple-500/30 px-6 py-3 text-white transition-all duration-300 hover:scale-[1.02] hover:bg-purple-500/10"
          >
            Explore Courses
          </Link>
        </div>

        <div className="mx-auto mt-12 grid max-w-md grid-cols-3 gap-8 text-center">
          <div>
            <h2 className="text-2xl font-semibold">50K+</h2>
            <p className="text-sm text-gray-400">Developers</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">200+</h2>
            <p className="text-sm text-gray-400">Challenges</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">95%</h2>
            <p className="text-sm text-gray-400">Completion</p>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-semibold">
            Why Choose <span className="text-purple-300">AlgoAliens</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Our platform combines modern learning flows with clean, consistent technical training.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {featureCards.map((card) => {
            const Icon = card.icon

            return (
              <div
                key={card.title}
                className="rounded-2xl border border-purple-500/15 bg-[rgba(18,9,42,0.9)] p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-purple-400/30 hover:shadow-lg"
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${card.iconClassName}`}
                >
                  <Icon size={20} />
                </div>

                <h3 className="font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{card.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section id="courses" className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h2 className="text-2xl font-semibold">Explore Our Courses</h2>
        <p className="mt-2 text-gray-400">
          From beginner to advanced, every path leads to verified skills.
        </p>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {previewCourses.map((course) => {
            const Icon = course.icon

            return (
              <div
                key={course.title}
                className="flex items-center justify-between rounded-2xl border border-purple-500/15 bg-[rgba(26,15,46,0.92)] p-6 text-left shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-purple-400/30"
              >
                <div className="flex items-center gap-4">
                  <Icon className="text-purple-300" size={24} />
                  <div>
                    <h3 className="font-medium text-white">{course.title}</h3>
                    <p className="text-sm text-gray-400">{course.description}</p>
                  </div>
                </div>
                <span className="text-purple-200">→</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="rounded-2xl border border-purple-500/15 bg-[linear-gradient(135deg,rgba(109,40,217,0.22),rgba(59,7,100,0.18))] p-10 text-center shadow-lg md:p-12">
          <Zap className="mx-auto mb-4 text-purple-200" size={32} />

          <h2 className="text-3xl font-semibold">Ready to Prove Your Skills?</h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-300">
            Join thousands of developers who are already mastering algorithms and getting
            certified.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <span>No credit card required</span>
            <span>3 free starter courses</span>
            <span>Free forever plan</span>
          </div>

          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 px-8 py-3 text-white shadow-md shadow-fuchsia-950/20 transition-all duration-300 hover:scale-[1.02]"
          >
            Start Learning Free →
          </Link>
        </div>
      </section>

      <footer className="border-t border-purple-500/10 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold text-purple-300">AlgoAliens</h3>
            <p className="mt-3 text-sm text-gray-400">Prove your skills. Earn trust.</p>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/courses">Courses</Link>
              </li>
              <li>
                <Link href="/certificates">Certificates</Link>
              </li>
              <li>
                <Link href="/signup">Get Started</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#about">About</a>
              </li>
              <li>
                <Link href="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link href="/profile">Profile</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/signin">Login</Link>
              </li>
              <li>
                <Link href="/forgot-password">Forgot Password</Link>
              </li>
              <li>
                <Link href="/courses">Course Catalog</Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">© 2026 AlgoAliens. All rights reserved.</p>
      </footer>
    </main>
  )
}
