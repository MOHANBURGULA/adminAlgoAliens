"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Edit3, LogOut, Mail, Save, ShieldCheck, Target, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { clearAuthSession } from "@/lib/auth"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage, isAxiosStatus } from "@/lib/http"
import { normalizeUserProfile } from "@/lib/profile"
import { cn } from "@/lib/utils"

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

function DetailCard({
  label,
  value,
  accentClassName,
}: {
  label: string
  value: string
  accentClassName: string
}) {
  return (
    <div className="group rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(25,14,43,0.94),rgba(18,11,32,0.94))] p-5 shadow-[0_18px_44px_rgba(9,3,18,0.24)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-fuchsia-400/24 hover:shadow-[0_22px_54px_rgba(168,85,247,0.2)]">
      <div className={cn("h-1.5 w-14 rounded-full bg-gradient-to-r", accentClassName)} />
      <p className="mt-4 text-sm tracking-[0.02em] text-fuchsia-100/72">{label}</p>
      <p className="mt-2 text-lg font-medium text-white">{value}</p>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const editorFieldClassName =
    "space-y-3 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,13,40,0.94),rgba(17,10,30,0.94))] p-4 shadow-[0_18px_42px_rgba(9,3,18,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-400/20 hover:shadow-[0_20px_48px_rgba(168,85,247,0.18)]"
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
          apiClient.get("/api/profile"),
        ])

        if (!cancelled) {
          const userData = userRes.data as UserResponse
          const profileData = normalizeUserProfile(profileRes.data as Partial<ProfileResponse>)
          setUser(userData)
          setProfile(profileData)
          hydrateForms(userData, profileData)
        }
      } catch (loadError: unknown) {
        if (cancelled) {
          return
        }

        if (isAxiosStatus(loadError, 404)) {
          router.replace("/onboarding")
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
    } catch (resetError: unknown) {
      const message = getApiErrorMessage(resetError, "Unable to send reset link.")
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
        apiClient.get("/api/profile"),
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
      <div className="card-ui flex min-h-[55vh] items-center justify-center text-gray-300">
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
    return <div className="card-ui text-gray-300">Profile data is not available yet.</div>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-purple-300">Profile</h1>
          <p className="mt-2 text-sm text-gray-400">
            Account and learning profile details from backend APIs.
          </p>
        </div>

        <Button
          type="button"
          variant={editMode ? "secondary" : "primary"}
          onClick={() => {
            if (editMode && user && profile) {
              hydrateForms(user, profile)
              setEditMode(false)
              return
            }

            setEditMode(true)
          }}
        >
          {editMode ? <X size={16} /> : <Edit3 size={16} />}
          {editMode ? "Cancel" : "Edit"}
        </Button>
      </div>

      <section className="card-ui relative !overflow-hidden !border-white/10 !bg-[linear-gradient(180deg,rgba(20,14,34,0.98),rgba(16,11,28,0.96))] !p-0 shadow-[0_28px_72px_rgba(9,3,18,0.34)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.18),transparent_42%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.12),transparent_34%)]" />

        <div className="relative border-b border-white/10 px-8 py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-fuchsia-300/20 bg-[linear-gradient(135deg,rgba(139,92,246,0.34),rgba(217,70,239,0.22))] text-3xl font-semibold text-white shadow-[0_18px_42px_rgba(168,85,247,0.24)]">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="app-gradient-text text-2xl font-semibold">{user.name}</h2>
              <p className="mt-1 text-sm text-fuchsia-50/72">{user.email}</p>
              <div className="mt-3 inline-flex rounded-full border border-fuchsia-300/16 bg-[linear-gradient(135deg,rgba(139,92,246,0.18),rgba(217,70,239,0.1))] px-3 py-1 text-xs text-fuchsia-100 shadow-[0_14px_28px_rgba(168,85,247,0.12)]">
                Role: {user.role}
              </div>
            </div>
          </div>
        </div>

        <div className="relative p-8">
          {!editMode ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <DetailCard
                  label="Name"
                  value={user.name}
                  accentClassName="from-violet-400 via-purple-400 to-fuchsia-400"
                />
                <DetailCard
                  label="Email"
                  value={user.email}
                  accentClassName="from-fuchsia-400 via-purple-400 to-violet-300"
                />
                <DetailCard
                  label="Skill level"
                  value={formatLabel(profile.skillLevel)}
                  accentClassName="from-purple-400 via-violet-400 to-fuchsia-300"
                />
                <DetailCard
                  label="Goal"
                  value={profile.goal || "Not set"}
                  accentClassName="from-fuchsia-500 via-violet-400 to-purple-300"
                />
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(25,14,43,0.94),rgba(18,11,32,0.94))] p-5 shadow-[0_18px_44px_rgba(9,3,18,0.24)] transition-all duration-300 hover:border-fuchsia-400/20 hover:shadow-[0_22px_54px_rgba(168,85,247,0.18)]">
                <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-300" />
                <p className="mt-4 text-sm tracking-[0.02em] text-fuchsia-100/72">Interests</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {profile.interests.length > 0 ? (
                    profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-fuchsia-300/14 bg-[linear-gradient(135deg,rgba(139,92,246,0.18),rgba(217,70,239,0.12))] px-4 py-2 text-sm text-fuchsia-50 transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-300/28 hover:shadow-[0_14px_28px_rgba(168,85,247,0.16)]"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-fuchsia-50/60">No interests added yet.</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <label className={editorFieldClassName}>
                <span className="flex items-center gap-2 text-sm text-fuchsia-50/78">
                  <User size={16} />
                  Full name
                </span>
                <Input
                  value={accountForm.name}
                  onChange={(event) =>
                    setAccountForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>

              <label className={editorFieldClassName}>
                <span className="flex items-center gap-2 text-sm text-fuchsia-50/78">
                  <Mail size={16} />
                  Email
                </span>
                <Input
                  value={accountForm.email}
                  disabled
                  readOnly
                  className="cursor-not-allowed opacity-60"
                />
              </label>

              <label className={editorFieldClassName}>
                <span className="flex items-center gap-2 text-sm text-fuchsia-50/78">
                  <ShieldCheck size={16} />
                  Skill level
                </span>
                <select
                  value={profileForm.skillLevel}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, skillLevel: event.target.value }))
                  }
                  className="input-ui"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </label>

              <label className={editorFieldClassName}>
                <span className="flex items-center gap-2 text-sm text-fuchsia-50/78">
                  <Target size={16} />
                  Goal
                </span>
                <Input
                  value={profileForm.goal}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, goal: event.target.value }))
                  }
                  placeholder="Your learning goal"
                />
              </label>

              <label className={cn(editorFieldClassName, "md:col-span-2")}>
                <span className="text-sm text-fuchsia-50/78">Interests</span>
                <Input
                  value={profileForm.interests}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      interests: event.target.value,
                    }))
                  }
                  placeholder="DSA, Web Development, DBMS"
                />
                <p className="text-xs text-fuchsia-50/58">
                  Separate multiple interests with commas.
                </p>
              </label>
            </div>
          )}
        </div>
      </section>

      {editMode ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={() => void handleSaveProfile()} disabled={saving}>
            <Save size={16} />
            {saving ? "Saving..." : "Save changes"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (user && profile) {
                hydrateForms(user, profile)
              }
              setEditMode(false)
            }}
          >
            Keep current values
          </Button>
        </div>
      ) : null}

      {resetStatus ? (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm ${
            resetStatusType === "success"
              ? "border-purple-500/20 bg-purple-500/10 text-purple-100"
              : "border-red-500/20 bg-red-500/10 text-red-100"
          }`}
        >
          {resetStatus}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="secondary" onClick={() => void handleResetPassword()}>
          <ShieldCheck size={16} />
          Send Password Reset Email
        </Button>

        <Button type="button" variant="danger" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </div>
  )
}
