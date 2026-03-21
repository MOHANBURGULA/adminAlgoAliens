"use client"

export default function Navbar() {
  return (
    <header className="h-16 border-b border-purple-900 bg-[#1A0F2E] flex items-center justify-between px-6">

      <input
        placeholder="Search..."
        className="bg-[#2D0B45] px-3 py-2 rounded-md outline-none"
      />

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-300">
          Notifications
        </span>

        <div className="w-8 h-8 rounded-full bg-purple-600" />
      </div>

    </header>
  )
}