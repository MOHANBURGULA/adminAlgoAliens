"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import {
  ArrowRight,
  Check,
  Edit3,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  X,
} from "lucide-react"
import { clearAuthSession } from "@/lib/auth"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage, isAxiosStatus } from "@/lib/http"
import { normalizeUserProfile } from "@/lib/profile"

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

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-lg font-medium text-white">{value}</p>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [accountForm, setAccountForm] = useState({
    name: "",
    email: "",
  })
  const [profileForm, setProfileForm] = useState({
    skillLevel: "",
    goal: "",
    interests: "",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [resetStatus, setResetStatus] = useState("")
  const [resetStatusType, setResetStatusType] = useState<"success" | "error" | "">("")

  const hydrateForms = (userData: UserResponse, profileData: ProfileResponse) => {
    setAccountForm({
      name: userData.name,
      email: userData.email,
    })
    setProfileForm({
      skillLevel: profileData.skillLevel || "",
      goal: profileData.goal || "",
      interests: profileData.interests.join(", "),
    })
  }

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
          const userData = userRes.data as UserResponse
          const profileData = normalizeUserProfile(
            profileRes.data as Partial<ProfileResponse>,
          )
          setUser(userData)
          setProfile(profileData)
          hydrateForms(userData, profileData)
        }
      } catch (loadError: unknown) {
        if (cancelled) {
          return
        }

        if (isAxiosStatus(loadError, 404)) {
          router.replace("/profile-setup")
          return
        }

        setError(getApiErrorMessage(loadError, "Unable to load your profile."))
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

  const handleResetPassword = async () => {
    try {
      setResetStatus("")
      setResetStatusType("")
      const response = await apiClient.post("/api/auth/change-password")
      const message = response.data?.message || "Password reset email sent successfully."
      setResetStatus(message)
      setResetStatusType("success")
      toast.success(message)
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Unable to send reset link.")
      setResetStatus(message)
      setResetStatusType("error")
      toast.error(message)
    }
  }

  const handleSaveProfile = async () => {
    if (!user || !profile) {
      return
    }

    if (!accountForm.name.trim()) {
      toast.error("Name is required")
      return
    }

    try {
      setSaving(true)

      const interests = profileForm.interests
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)

      await Promise.all([
        apiClient.put("/api/users/me", {
          name: accountForm.name.trim(),
        }),
        apiClient.post("/api/users/profile", {
          skillLevel: profileForm.skillLevel,
          goal: profileForm.goal,
          interests,
        }),
      ])

      const [userRes, profileRes] = await Promise.all([
        apiClient.get("/api/users/me"),
        apiClient.get("/api/users/profile"),
      ])

      const nextUser = userRes.data as UserResponse
      const nextProfile = normalizeUserProfile(profileRes.data as Partial<ProfileResponse>)

      setUser(nextUser)
      setProfile(nextProfile)
      hydrateForms(nextUser, nextProfile)
      setEditMode(false)
      toast.success("Profile updated successfully")
    } catch (saveError: unknown) {
      toast.error(getApiErrorMessage(saveError, "Unable to update profile."))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center rounded-3xl border border-purple-900/20 bg-[#0B0518]/80 text-gray-300">
        Loading profile...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
        {error}
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="rounded-3xl border border-dashed border-purple-900/40 bg-[#0B0518] p-8 text-gray-400">
        Profile data is not available yet.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-purple-200">
            <Sparkles size={14} />
            Profile Overview
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">Your learner identity</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
            Review your account information, learning focus, and password reset options in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (editMode && user && profile) {
              hydrateForms(user, profile)
              setEditMode(false)
              return
            }

            setEditMode(true)
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-purple-700/40 bg-white/[0.02] px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-500/10"
        >
          {editMode ? <X size={16} /> : <Edit3 size={16} />}
          {editMode ? "Cancel editing" : "Edit profile"}
        </button>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-purple-900/30 bg-[#0B0518]/95 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="border-b border-white/5 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.2),transparent_38%),linear-gradient(135deg,rgba(19,10,36,0.95),rgba(11,5,24,0.95))] p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/5 text-4xl font-semibold text-purple-200 ring-1 ring-white/10">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-semibold uppercase tracking-tight text-white">{user.name}</h2>
              <p className="mt-2 text-sm text-gray-300">{user.email}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                  Role: {user.role}
                </span>
                <span className="inline-flex rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-medium text-purple-100">
                  Skill: {formatLabel(profile.skillLevel)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {!editMode ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard icon={<User size={16} />} label="Name" value={user.name} />
                <InfoCard icon={<Mail size={16} />} label="Email" value={user.email} />
                <InfoCard icon={<ShieldCheck size={16} />} label="Skill level" value={formatLabel(profile.skillLevel)} />
                <InfoCard icon={<Target size={16} />} label="Goal" value={profile.goal || "Not set"} />
              </div>

              <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-sm font-medium text-gray-300">Interests</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {profile.interests.length > 0 ? (
                    profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-100"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">No interests added yet.</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <User size={16} />
                    Name
                  </div>
                  <input
                    value={accountForm.name}
                    onChange={(event) =>
                      setAccountForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="input-ui mt-4"
                    placeholder="Full name"
                  />
                </label>

                <label className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail size={16} />
                    Email
                  </div>
                  <input
                    value={accountForm.email}
                    className="input-ui mt-4 cursor-not-allowed opacity-60"
                    placeholder="Email address"
                    type="email"
                    disabled
                    readOnly
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Email is managed by your auth account and cannot be edited here.
                  </p>
                </label>

                <label className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <ShieldCheck size={16} />
                    Skill level
                  </div>
                  <select
                    value={profileForm.skillLevel}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, skillLevel: event.target.value }))
                    }
                    className="input-ui mt-4"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>

                <label className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Target size={16} />
                    Goal
                  </div>
                  <input
                    value={profileForm.goal}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, goal: event.target.value }))
                    }
                    className="input-ui mt-4"
                    placeholder="Your learning goal"
                  />
                </label>
              </div>

              <label className="block rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <div className="text-sm font-medium text-gray-300">Interests</div>
                <p className="mt-2 text-xs text-gray-500">Separate multiple interests with commas.</p>
                <input
                  value={profileForm.interests}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, interests: event.target.value }))
                  }
                  className="input-ui mt-4"
                  placeholder="DSA, Web Development, DBMS"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void handleSaveProfile()}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save changes"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (user && profile) {
                      hydrateForms(user, profile)
                    }
                    setEditMode(false)
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.05]"
                >
                  <Check size={16} />
                  Keep current values
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {resetStatus ? (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm ${
            resetStatusType === "success"
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
              : "border-red-500/25 bg-red-500/10 text-red-100"
          }`}
        >
          {resetStatus}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void handleResetPassword()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/15"
        >
          <ShieldCheck size={16} />
          Send Password Reset Email
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-500"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  )
}
