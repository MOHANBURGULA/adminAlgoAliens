// import Link from "next/link"

// export default function PublicNavbar() {
//   return (
//     <nav className="w-full border-b border-purple-900/30 backdrop-blur-sm">

//       <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

//         {/* Logo */}
//         <Link href="/" className="text-xl font-bold">
//           AlgoAliens
//         </Link>

//         {/* Navigation */}
//         <div className="flex items-center gap-8 text-sm text-gray-300">

//           <Link href="/" className="hover:text-white">
//             Home
//           </Link>

//           <Link href="/courses" className="hover:text-white">
//             Courses
//           </Link>
          
//           <Link href="/signin" className="hover:text-white">
//             Login
//           </Link>

//           <Link href="/signup" className="hover:text-white">
//             Signup
//           </Link>

//         </div>

//       </div>

//     </nav>
//   )
// }
import Link from "next/link"

export default function PublicNavbar() {
  return (
    <nav className="w-full border-b border-purple-900/30 backdrop-blur-sm">

      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          AlgoAliens
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6 text-sm text-gray-300">

          <Link href="/" className="hover:text-white">
            Home
          </Link>

          <Link href="/courses" className="hover:text-white">
            Courses
          </Link>

          {/* ✅ Login */}
          <Link href="/signin" className="hover:text-white">
            Login
          </Link>

          {/* ✅ Signup (CTA button) */}
          <Link href="/signup">
            <button className="bg-gradient-to-r from-purple-500 to-cyan-400 px-4 py-2 rounded-lg text-white">
              Get Started
            </button>
          </Link>

        </div>

      </div>

    </nav>
  )
}