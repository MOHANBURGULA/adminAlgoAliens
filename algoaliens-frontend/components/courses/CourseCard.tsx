"use client"

import Link from "next/link"

export default function CourseCard({course}:any){

  return(

    <div className="bg-[#1A0F2E] border border-purple-900 rounded-xl p-6
    hover:border-purple-600 transition">

      <h2 className="text-lg font-semibold mb-2">
        {course.title}
      </h2>

      <p className="text-sm text-gray-400 mb-4">
        {course.modules} modules
      </p>

      {/* Progress */}

      <div className="w-full h-2 bg-[#0F0A19] rounded mb-3">

        <div
          style={{width:`${course.progress}%`}}
          className="h-2 bg-gradient-to-r from-purple-500 to-cyan-400 rounded"
        />

      </div>

      <p className="text-xs text-gray-400 mb-5">
        {course.progress}% completed
      </p>

      <Link
        href={`/courses/${course.id}`}
        className="w-full block text-center py-2 rounded-lg
        bg-gradient-to-r from-purple-600 to-cyan-400"
      >
        Resume Course
      </Link>

    </div>
  )
}