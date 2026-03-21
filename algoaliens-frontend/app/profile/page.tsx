"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Edit3, LogOut, Mail, ShieldCheck, Target, User } from "lucide-react"
import { clearAuthSession } from "@/lib/auth"
import { apiClient } from "@/lib/axios"

type UserResponse = {
  id: number
  name: string
  email: string
  role: string
}

type ProfileResponse = {
  skillLevel: string
  interests: string[]
  goal?: string
}

function formatLabel(value?: string) {
  if (!value) {
    return "Not set"
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      try {
        setLoading(true)
        setError("")

        const [userRes, profileRes] = await Promise.all([
          apiClient.get("/api/users/me"),
          apiClient.get("/api/users/profile"),
        ])

        if (!cancelled) {
          setUser(userRes.data as UserResponse)
          setProfile(profileRes.data as ProfileResponse)
        }
      } catch (loadError: any) {
        if (cancelled) {
          return
        }

        if (loadError?.response?.status === 404) {
          router.replace("/profile-setup")
          return
        }

        setError(
          loadError?.response?.data?.message || "Unable to load your profile.",
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [router])

  const handleLogout = () => {
    clearAuthSession()
    toast.success("Logged out")
    router.replace("/signin")
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-300">
        Loading profile...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
        {error}
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="rounded-2xl border border-dashed border-purple-900/40 bg-[#0B0518] p-8 text-gray-400">
        Profile data is not available yet.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-purple-300">Profile</h1>
          <p className="mt-2 text-sm text-gray-400">
            Account and learning profile details from backend APIs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast("Editing UI is ready. Save support can be wired next.")}
          className="inline-flex items-center gap-2 rounded-lg border border-purple-700/40 px-4 py-2 text-sm text-white hover:bg-purple-500/10"
        >
          <Edit3 size={16} />
          Edit
        </button>
      </div>

      <div className="rounded-2xl border border-purple-900/30 bg-[#0B0518] p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#130A24] text-3xl font-semibold text-purple-300">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white">{user.name}</h2>
            <p className="mt-1 text-sm text-gray-400">{user.email}</p>
            <div className="mt-3 inline-flex rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-100">
              Role: {user.role}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-[#12092A] p-5">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <User size={16} />
              Name
            </div>
            <p className="mt-2 text-lg text-white">{user.name}</p>
          </div>

          <div className="rounded-2xl bg-[#12092A] p-5">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Mail size={16} />
              Email
            </div>
            <p className="mt-2 text-lg text-white">{user.email}</p>
          </div>

          <div className="rounded-2xl bg-[#12092A] p-5">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <ShieldCheck size={16} />
              Skill level
            </div>
            <p className="mt-2 text-lg text-white">
              {formatLabel(profile.skillLevel)}
            </p>
          </div>

          <div className="rounded-2xl bg-[#12092A] p-5">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Target size={16} />
              Goal
            </div>
            <p className="mt-2 text-lg text-white">
              {profile.goal || "Not set"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-[#12092A] p-5">
          <p className="text-sm text-gray-400">Interests</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {profile.interests.length > 0 ? (
              profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-purple-500/15 px-4 py-2 text-sm text-purple-100"
                >
                  {interest}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-400">No interests added yet.</span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-500"
      >
        <LogOut size={16} />
        Logout
      </button>
    </div>
  )
}
