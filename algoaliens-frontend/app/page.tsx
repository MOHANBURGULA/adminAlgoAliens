import {
  Database,
  Network,
  Cpu,
  Code,
  Braces,
  ShieldCheck,
  Gift,
  Terminal
} from "lucide-react"
// import { Terminal } from "lucide-react"
import { Zap } from "lucide-react"
import Link from "next/link"


export default function Home() {
  return (
    <main className="min-h-screen text-white">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 w-full z-50
bg-[#070312]/70 backdrop-blur border-b border-purple-900/30">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-sm">
              🛸
            </div>

            <span className="font-semibold text-white">
              AlgoAliens
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">

            {/* <a href="#features" className="hover:text-white transition">
              Features
            </a>
             */}

            <a href="#courses" className="hover:text-white transition">
              Courses
            </a>

            <a href="#about" className="hover:text-white transition">
              About
            </a>
            {/* 
            <a href="#resources" className="hover:text-white transition">
              Resources
            </a> */}

          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">

            <Link
              href="/signin"
              className="text-sm text-gray-300 hover:text-white"
            >

            </Link>

           <Link
  href="/signin"
  className="text-sm text-gray-300 hover:text-white"
>
  Login
</Link>

            <Link
              href="/signup"
              className="px-4 py-2 rounded-lg text-sm
        bg-gradient-to-r from-purple-500 to-cyan-400"
            >
              Get Started
            </Link>

          </div>

        </div>

      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-32 text-center">

        <span className="text-xs px-4 py-1 border border-purple-600 rounded-full text-purple-400">
          Skill Verification Platform
        </span>

        <h1 className="text-4xl md:text-6xl font-bold mt-6 leading-tight">
          Master Algorithms with
          <span className="block text-purple-400">
            AlgoAliens
          </span>
        </h1>

        <p className="text-gray-400 mt-6 max-w-xl mx-auto">
          Prove your coding skills through real challenges, projects,
          and skill verification.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Link
            href="/signup"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-400"
          >
            Start Learning
          </Link>

          <Link
            href="/courses"
            className="px-6 py-3 rounded-lg border border-purple-500"
          >
            Explore Courses
          </Link>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-8 mt-12 max-w-md mx-auto text-center">

          <div>
            <h2 className="text-2xl font-semibold">50K+</h2>
            <p className="text-gray-400 text-sm">Developers</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">200+</h2>
            <p className="text-gray-400 text-sm">Challenges</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">95%</h2>
            <p className="text-gray-400 text-sm">Completion</p>
          </div>

        </div>

      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-28">

        <div className="text-center">
          <h2 className="text-3xl font-semibold">
            Why Choose <span className="text-purple-400">AlgoAliens</span>?
          </h2>

          <p className="text-gray-400 mt-4 max-w-xl mx-auto">
            Our platform combines cutting-edge technology with proven
            learning methodologies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">

          {/* Card 1 */}
          <div className="p-6 rounded-xl border border-purple-900/40 bg-[#12092A]
    hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition">

            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-cyan-500/20 mb-4">
              <Terminal className="text-cyan-400" size={20} />
            </div>

            <h3 className="font-semibold">
              Interactive Coding Challenges
            </h3>

            <p className="text-gray-400 text-sm mt-2">
              Solve real problems with an in-browser code editor.
              Debug, optimize, and submit.
            </p>

          </div>


          {/* Card 2 */}
          <div className="p-6 rounded-xl border border-purple-900/40 bg-[#12092A]
    hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition">

            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-pink-500/20 mb-4">
              <Zap className="text-pink-400" size={20} />
            </div>

            <h3 className="font-semibold">
              AI-Powered Learning Paths
            </h3>

            <p className="text-gray-400 text-sm mt-2">
              Adaptive modules that evolve with your skill level
              and learning speed.
            </p>

          </div>


          {/* Card 3 */}
          <div className="p-6 rounded-xl border border-purple-900/40 bg-[#12092A]
    hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition">

            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-green-500/20 mb-4">
              <ShieldCheck className="text-green-400" size={20} />
            </div>

            <h3 className="font-semibold">
              Skill Verification Certificates
            </h3>

            <p className="text-gray-400 text-sm mt-2">
              Blockchain-verified certificates that prove
              real competence to recruiters.
            </p>

          </div>


          {/* Card 4 */}
          <div className="p-6 rounded-xl border border-purple-900/40 bg-[#12092A]
    hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition">

            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-orange-500/20 mb-4">
              <Gift className="text-orange-400" size={20} />
            </div>

            <h3 className="font-semibold">
              Real Project Submissions
            </h3>

            <p className="text-gray-400 text-sm mt-2">
              Build portfolio projects reviewed
              by industry experts.
            </p>

          </div>

        </div>

      </section>

      {/* COURSE PREVIEW */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">

        <h2 className="text-2xl font-semibold">
          Explore Our Courses
        </h2>

        <p className="text-gray-400 mt-2">
          From beginner to advanced — every path leads to verified skills.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">

          {/* DSA */}
          <div className="flex items-center justify-between border border-purple-800 p-6 rounded-xl bg-[#1A0F2E] hover:border-purple-500 transition">
            <div className="flex items-center gap-4">
              <Code className="text-purple-400" size={24} />
              <div className="text-left">
                <h3 className="font-medium">Data Structures & Algorithms</h3>
                <p className="text-sm text-gray-400">Debugging tasks</p>
              </div>
            </div>
            →
          </div>

          {/* SQL */}
          <div className="flex items-center justify-between border border-purple-800 p-6 rounded-xl bg-[#1A0F2E] hover:border-purple-500 transition">
            <div className="flex items-center gap-4">
              <Database className="text-purple-400" size={24} />
              <div className="text-left">
                <h3 className="font-medium">SQL Mastery</h3>
                <p className="text-sm text-gray-400">Query correction tasks</p>
              </div>
            </div>
            →
          </div>

          {/* Networks */}
          <div className="flex items-center justify-between border border-purple-800 p-6 rounded-xl bg-[#1A0F2E] hover:border-purple-500 transition">
            <div className="flex items-center gap-4">
              <Network className="text-purple-400" size={24} />
              <div className="text-left">
                <h3 className="font-medium">Computer Networks</h3>
                <p className="text-sm text-gray-400">Scenario analysis</p>
              </div>
            </div>
            →
          </div>

          {/* OS */}
          <div className="flex items-center justify-between border border-purple-800 p-6 rounded-xl bg-[#1A0F2E] hover:border-purple-500 transition">
            <div className="flex items-center gap-4">
              <Cpu className="text-purple-400" size={24} />
              <div className="text-left">
                <h3 className="font-medium">Operating Systems</h3>
                <p className="text-sm text-gray-400">Debugging + concept checks</p>
              </div>
            </div>
            →
          </div>

          {/* Java */}
          <div className="flex items-center justify-between border border-purple-800 p-6 rounded-xl bg-[#1A0F2E] hover:border-purple-500 transition">
            <div className="flex items-center gap-4">
              <Braces className="text-purple-400" size={24} />
              <div className="text-left">
                <h3 className="font-medium">Java Programming</h3>
                <p className="text-sm text-gray-400">Debugging & OOP fixes</p>
              </div>
            </div>
            →
          </div>

          {/* Python */}
          <div className="flex items-center justify-between border border-purple-800 p-6 rounded-xl bg-[#1A0F2E] hover:border-purple-500 transition">
            <div className="flex items-center gap-4">
              <Terminal className="text-purple-400" size={24} />
              <div className="text-left">
                <h3 className="font-medium">Python for DSA</h3>
                <p className="text-sm text-gray-400">Debugging tasks</p>
              </div>
            </div>
            →
          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24">

        <div className="rounded-2xl p-12 text-center border border-purple-900/40
  bg-gradient-to-r from-purple-700/40 to-blue-500/30 backdrop-blur">

          <Zap className="mx-auto text-cyan-400 mb-4" size={32} />

          <h2 className="text-3xl font-bold">
            Ready to Prove Your Skills?
          </h2>

          <p className="text-gray-300 mt-4 max-w-xl mx-auto">
            Join thousands of developers who are already mastering algorithms
            and getting certified.
          </p>

          <div className="flex justify-center gap-6 text-sm text-gray-400 mt-4">
            <span>✓ No credit card required</span>
            <span>✓ 3 courses free</span>
            <span>✓ Free forever plan</span>
          </div>

          <Link
            href="/signup"
            className="inline-block mt-8 px-8 py-3 rounded-lg
      bg-gradient-to-r from-purple-500 to-cyan-400
      hover:opacity-90 transition"
          >
            Start Learning Free →
          </Link>

        </div>

      </section>


      {/* FOOTER */}
      <footer className="border-t border-purple-900/30 py-16">

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <h3 className="text-lg font-semibold text-purple-400">
              AlgoAliens
            </h3>

            <p className="text-gray-400 text-sm mt-3">
              Prove your skills. Earn trust.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-3">Platform</h4>

            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/courses">Courses</Link>
              </li>

              <li>
                <Link href="/certificates">Certificates</Link>
              </li>

              <li>
                <Link href="#">Pricing</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-3">Company</h4>

            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="#">About</Link>
              </li>

              <li>
                <Link href="#">Blog</Link>
              </li>

              <li>
                <Link href="#">Careers</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-3">Support</h4>

            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="#">Help Center</Link>
              </li>

              <li>
                <Link href="#">Contact</Link>
              </li>

              <li>
                <Link href="#">Privacy Policy</Link>
              </li>
            </ul>
          </div>

        </div>

        <p className="text-center text-gray-500 text-sm mt-10">
          © 2026 AlgoAliens. All rights reserved.
        </p>

      </footer>

    </main>
  )
}