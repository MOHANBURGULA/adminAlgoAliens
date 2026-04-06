import Link from "next/link"
import PublicNavbar from "@/components/layout/PublicNavbar"
import {
  ArrowRight,
  Braces,
  Code,
  Cpu,
  Database,
  Gift,
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
    title: "Interactive Coding Challenges",
  },
  {
    description:
      "Adaptive modules that evolve with your skill level and learning speed.",
    icon: Zap,
    title: "AI-Powered Learning Paths",
  },
  {
    description:
      "Certificates that prove real competence and showcase verified skills.",
    icon: ShieldCheck,
    title: "Skill Verification Certificates",
  },
  {
    description:
      "Build portfolio projects reviewed around practical, job-ready outcomes.",
    icon: Gift,
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
    <main className="landing-shell">
      <PublicNavbar />

      <section className="mx-auto max-w-5xl px-6 pb-10 pt-24 text-center md:px-8 md:pb-14 md:pt-28">
        <span className="brand-pill px-4 py-1 text-xs">Skill Verification Platform</span>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-[1.2] text-theme-main md:text-6xl">
          Master Algorithms with
          <span className="accent-gradient-text block">AlgoAliens</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-theme-muted">
          Prove your coding skills through real challenges, projects, and skill verification.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/signup" className="theme-button-primary px-6 py-3">
            Start Learning
          </Link>

          <Link href="/courses" className="landing-outline-button px-6 py-3">
            Explore Courses
          </Link>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
          <div className="landing-card p-5 text-center">
            <h2 className="text-2xl font-semibold text-theme-main">50K+</h2>
            <p className="mt-2 text-sm text-theme-muted">Developers</p>
          </div>
          <div className="landing-card p-5 text-center">
            <h2 className="text-2xl font-semibold text-theme-main">200+</h2>
            <p className="mt-2 text-sm text-theme-muted">Challenges</p>
          </div>
          <div className="landing-card p-5 text-center">
            <h2 className="text-2xl font-semibold text-theme-main">95%</h2>
            <p className="mt-2 text-sm text-theme-muted">Completion</p>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold leading-[1.25] text-theme-main md:text-4xl">
            Why Choose <span className="accent-gradient-text">AlgoAliens</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-theme-muted">
            Our platform combines modern learning flows with clean, consistent technical training.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((card) => {
            const Icon = card.icon

            return (
              <div key={card.title} className="landing-card p-5">
                <div className="landing-feature-icon flex h-11 w-11 items-center justify-center">
                  <Icon size={20} strokeWidth={1.8} />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-theme-main">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-theme-muted">{card.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section id="courses" className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold leading-[1.25] text-theme-main md:text-4xl">
            Explore Our Courses
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-theme-muted">
            From beginner to advanced, every path leads to verified skills.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3">
          {previewCourses.map((course) => {
            const Icon = course.icon

            return (
              <div
                key={course.title}
                className="landing-card flex items-center justify-between gap-4 p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="landing-feature-icon flex h-10 w-10 items-center justify-center">
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-theme-main">{course.title}</h3>
                    <p className="mt-1 text-sm text-theme-muted">{course.description}</p>
                  </div>
                </div>
                <ArrowRight className="shrink-0 text-theme-muted" size={16} strokeWidth={1.8} />
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:px-8 md:py-20">
        <div className="landing-cta-panel p-8 text-center md:p-10">
          <Zap className="mx-auto text-[var(--accent-cyan)]" size={28} strokeWidth={1.8} />

          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold leading-[1.25] text-theme-main">
            Ready to Prove Your Skills?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-theme-muted">
            Join thousands of developers who are already mastering algorithms and getting
            certified.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-6 text-sm text-theme-muted">
            <span>No credit card required</span>
            <span>3 free starter courses</span>
            <span>Free forever plan</span>
          </div>

          <Link href="/signup" className="theme-button-primary mt-8 inline-flex px-8 py-3">
            Start Learning Free
          </Link>
        </div>
      </section>

      <footer className="py-16" style={{ borderTop: "var(--card-border)" }}>
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-4 md:px-8">
          <div>
            <h3 className="text-lg font-semibold accent-gradient-text">AlgoAliens</h3>
            <p className="mt-3 text-sm text-theme-muted">Prove your skills. Earn trust.</p>
          </div>

          <div>
            <h4 className="mb-3 font-semibold text-theme-main">Platform</h4>
            <ul className="space-y-2 text-sm text-theme-muted">
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
            <h4 className="mb-3 font-semibold text-theme-main">Company</h4>
            <ul className="space-y-2 text-sm text-theme-muted">
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
            <h4 className="mb-3 font-semibold text-theme-main">Support</h4>
            <ul className="space-y-2 text-sm text-theme-muted">
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

        <p className="mt-10 text-center text-sm text-theme-muted">
          Copyright 2026 AlgoAliens. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
