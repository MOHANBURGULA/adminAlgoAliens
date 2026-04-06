"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import type { LucideIcon } from "lucide-react"
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Award,
  Bot,
  Braces,
  Briefcase,
  Calendar,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Cloud,
  Clock3,
  Code2,
  Flame,
  Gauge,
  Globe,
  GraduationCap,
  Layers3,
  Loader2,
  Milestone,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Target,
  Timer,
  TrendingUp,
  UserRound,
  Zap,
} from "lucide-react"
import { OnboardingSummary } from "@/components/onboarding/OnboardingSummary"
import { ChoiceCard } from "@/components/onboarding/ChoiceCard"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { clearAuthSession } from "@/lib/auth"
import { apiClient } from "@/lib/axios"
import { getApiErrorMessage } from "@/lib/http"
import {
  buildOnboardingPayload,
  CAREER_GOAL_OPTIONS,
  clearOnboardingDraft,
  CODING_EXPERIENCE_OPTIONS,
  createEmptyOnboardingForm,
  getFirstIncompleteOnboardingStep,
  getOnboardingStepError,
  loadOnboardingDraft,
  mergeOnboardingState,
  ROLE_OPTIONS,
  saveOnboardingDraft,
  SKILL_DOMAIN_OPTIONS,
  SKILL_LEVEL_OPTIONS,
  TARGET_TIMELINE_OPTIONS,
  WEEKLY_HOURS_OPTIONS,
  type OnboardingFormData,
} from "@/lib/onboarding"
import { normalizeUserProfile, type UserProfileData } from "@/lib/profile"

type StepDefinition = {
  title: string
  description: string
  helper: string
}

type OptionDefinition<TValue extends string | boolean> = {
  value: TValue
  label: string
  description: string
  icon: LucideIcon
}

const STEP_DEFINITIONS: StepDefinition[] = [
  {
    title: "Which role best describes you today?",
    description: "We use this to shape how your recommendations, pacing, and milestones feel.",
    helper: "Pick the context you are learning from right now.",
  },
  {
    title: "What outcome matters most right now?",
    description: "Your goal helps us tailor the first set of actions and suggested course paths.",
    helper: "Choose the result you want this journey to unlock first.",
  },
  {
    title: "Which domains do you want to focus on?",
    description: "Select one or more areas so your dashboard feels relevant from day one.",
    helper: "Multi-select is enabled here.",
  },
  {
    title: "How would you describe your current skill level?",
    description: "This helps us avoid pushing you too fast or repeating what you already know.",
    helper: "Choose the level that feels honest, not aspirational.",
  },
  {
    title: "Do you already have coding experience?",
    description: "We will adjust your early path depending on whether you need first-principles support.",
    helper: "A simple yes or no is enough here.",
  },
  {
    title: "How much time can you invest each week?",
    description: "We use this to set an achievable pace and more realistic recommendations.",
    helper: "Choose the commitment you can maintain consistently.",
  },
  {
    title: "What timeline are you aiming for?",
    description: "A timeline helps us tune urgency, sequencing, and progress expectations.",
    helper: "You can stay flexible if you do not want a fixed deadline yet.",
  },
]

const ROLE_CARDS: OptionDefinition<string>[] = [
  { ...ROLE_OPTIONS[0], icon: GraduationCap },
  { ...ROLE_OPTIONS[1], icon: Briefcase },
  { ...ROLE_OPTIONS[2], icon: UserRound },
]

const CAREER_GOAL_CARDS: OptionDefinition<string>[] = [
  { ...CAREER_GOAL_OPTIONS[0], icon: Target },
  { ...CAREER_GOAL_OPTIONS[1], icon: Sparkles },
  { ...CAREER_GOAL_OPTIONS[2], icon: Award },
  { ...CAREER_GOAL_OPTIONS[3], icon: ArrowLeftRight },
]

const SKILL_DOMAIN_CARDS: OptionDefinition<string>[] = [
  { ...SKILL_DOMAIN_OPTIONS[0], icon: Braces },
  { ...SKILL_DOMAIN_OPTIONS[1], icon: Globe },
  { ...SKILL_DOMAIN_OPTIONS[2], icon: Bot },
  { ...SKILL_DOMAIN_OPTIONS[3], icon: Cloud },
  { ...SKILL_DOMAIN_OPTIONS[4], icon: Layers3 },
  { ...SKILL_DOMAIN_OPTIONS[5], icon: Shield },
]

const SKILL_LEVEL_CARDS: OptionDefinition<string>[] = [
  { ...SKILL_LEVEL_OPTIONS[0], icon: Sprout },
  { ...SKILL_LEVEL_OPTIONS[1], icon: TrendingUp },
  { ...SKILL_LEVEL_OPTIONS[2], icon: Flame },
]

const CODING_EXPERIENCE_CARDS: OptionDefinition<boolean>[] = [
  { ...CODING_EXPERIENCE_OPTIONS[0], icon: Code2 },
  { ...CODING_EXPERIENCE_OPTIONS[1], icon: CircleDashed },
]

const WEEKLY_HOURS_CARDS: OptionDefinition<string>[] = [
  { ...WEEKLY_HOURS_OPTIONS[0], icon: Clock3 },
  { ...WEEKLY_HOURS_OPTIONS[1], icon: Calendar },
  { ...WEEKLY_HOURS_OPTIONS[2], icon: Gauge },
  { ...WEEKLY_HOURS_OPTIONS[3], icon: Zap },
]

const TIMELINE_CARDS: OptionDefinition<string>[] = [
  { ...TARGET_TIMELINE_OPTIONS[0], icon: Timer },
  { ...TARGET_TIMELINE_OPTIONS[1], icon: CalendarDays },
  { ...TARGET_TIMELINE_OPTIONS[2], icon: Milestone },
  { ...TARGET_TIMELINE_OPTIONS[3], icon: SlidersHorizontal },
]

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div
        className="w-full max-w-md rounded-[2rem] border p-8 text-center"
        style={{
          background: "var(--panel-background)",
          border: "var(--card-border)",
          boxShadow: "var(--card-shadow-strong)",
        }}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <Loader2 className="animate-spin text-[var(--accent-cyan)]" size={24} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-theme-main">Loading onboarding</h1>
        <p className="mt-2 text-sm leading-7 text-theme-muted">
          Restoring your draft and checking whether onboarding is still required.
        </p>
      </div>
    </div>
  )
}

function StepBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-theme-muted">
      {children}
    </span>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<OnboardingFormData>(createEmptyOnboardingForm)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [stepMessage, setStepMessage] = useState("")
  const [pageError, setPageError] = useState("")
  const hasHydratedDraft = useRef(false)
  const submitLockedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      try {
        setLoading(true)
        setPageError("")

        const response = await apiClient.get<UserProfileData>("/api/profile")
        const profile = normalizeUserProfile(response.data as Partial<UserProfileData>)

        if (cancelled) {
          return
        }

        if (profile.onboarding_completed) {
          clearOnboardingDraft()
          router.replace("/dashboard")
          return
        }

        const draft = loadOnboardingDraft()
        const mergedState = mergeOnboardingState(profile, draft)

        setFormData(mergedState.data)
        setCurrentStep(mergedState.step)
        setStepMessage("")
        hasHydratedDraft.current = true
      } catch (error: unknown) {
        if (cancelled) {
          return
        }

        if (
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { status?: number } }).response?.status === 401
        ) {
          clearAuthSession()
          router.replace("/signin")
          return
        }

        setPageError(getApiErrorMessage(error, "Unable to load onboarding right now."))
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

  useEffect(() => {
    if (!hasHydratedDraft.current || loading) {
      return
    }

    saveOnboardingDraft({
      step: currentStep,
      data: formData,
    })
  }, [currentStep, formData, loading])

  const progressValue = useMemo(
    () => ((currentStep + 1) / STEP_DEFINITIONS.length) * 100,
    [currentStep],
  )

  const currentStepDefinition = STEP_DEFINITIONS[currentStep]
  const isFinalStep = currentStep === STEP_DEFINITIONS.length - 1
  const currentStepError = getOnboardingStepError(currentStep, formData)

  const handleSingleSelect = (
    field: "role" | "career_goal" | "skillLevel" | "weekly_hours" | "target_timeline",
    value: string,
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
    setStepMessage("")
  }

  const handleCodingExperience = (value: boolean) => {
    setFormData((current) => ({
      ...current,
      coding_experience: value,
    }))
    setStepMessage("")
  }

  const toggleSkillDomain = (value: string) => {
    setFormData((current) => {
      const exists = current.skill_domains.includes(value)

      return {
        ...current,
        skill_domains: exists
          ? current.skill_domains.filter((entry) => entry !== value)
          : [...current.skill_domains, value],
      }
    })
    setStepMessage("")
  }

  const handleNext = () => {
    if (currentStepError) {
      setStepMessage(currentStepError)
      return
    }

    setStepMessage("")
    setCurrentStep((value) => Math.min(value + 1, STEP_DEFINITIONS.length - 1))
  }

  const handleBack = () => {
    setStepMessage("")
    setCurrentStep((value) => Math.max(value - 1, 0))
  }

  const handleSubmit = async () => {
    const firstIncompleteStep = getFirstIncompleteOnboardingStep(formData)
    const validationMessage = getOnboardingStepError(firstIncompleteStep, formData)

    if (validationMessage) {
      setCurrentStep(firstIncompleteStep)
      setStepMessage(validationMessage)
      return
    }

    if (submitLockedRef.current) {
      return
    }

    try {
      submitLockedRef.current = true
      setSubmitting(true)
      setStepMessage("")

      await apiClient.post("/api/onboarding", buildOnboardingPayload(formData))

      clearOnboardingDraft()
      toast.success("Your onboarding is complete.")
      router.replace("/dashboard")
    } catch (error: unknown) {
      submitLockedRef.current = false

      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { status?: number } }).response?.status === 401
      ) {
        clearAuthSession()
        router.replace("/signin")
        return
      }

      const message = getApiErrorMessage(error, "Unable to save onboarding right now.")
      setStepMessage(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const renderOptions = <TValue extends string | boolean>(
    options: OptionDefinition<TValue>[],
    isSelected: (value: TValue) => boolean,
    onSelect: (value: TValue) => void,
    columns = "md:grid-cols-2",
  ) => (
    <div className={`grid gap-4 ${columns}`}>
      {options.map((option) => (
        <ChoiceCard
          key={String(option.value)}
          title={option.label}
          description={option.description}
          selected={isSelected(option.value)}
          onClick={() => onSelect(option.value)}
          icon={option.icon}
          disabled={submitting}
        />
      ))}
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderOptions(
          ROLE_CARDS,
          (value) => formData.role === value,
          (value) => handleSingleSelect("role", value),
          "md:grid-cols-3",
        )
      case 1:
        return renderOptions(
          CAREER_GOAL_CARDS,
          (value) => formData.career_goal === value,
          (value) => handleSingleSelect("career_goal", value),
        )
      case 2:
        return (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <StepBadge>Multi-select enabled</StepBadge>
              <span className="text-sm text-theme-muted">
                {formData.skill_domains.length} domain
                {formData.skill_domains.length === 1 ? "" : "s"} selected
              </span>
            </div>
            {renderOptions(
              SKILL_DOMAIN_CARDS,
              (value) => formData.skill_domains.includes(value),
              toggleSkillDomain,
            )}
          </div>
        )
      case 3:
        return renderOptions(
          SKILL_LEVEL_CARDS,
          (value) => formData.skillLevel === value,
          (value) => handleSingleSelect("skillLevel", value),
          "md:grid-cols-3",
        )
      case 4:
        return renderOptions(
          CODING_EXPERIENCE_CARDS,
          (value) => formData.coding_experience === value,
          handleCodingExperience,
        )
      case 5:
        return renderOptions(
          WEEKLY_HOURS_CARDS,
          (value) => formData.weekly_hours === value,
          (value) => handleSingleSelect("weekly_hours", value),
        )
      case 6:
        return renderOptions(
          TIMELINE_CARDS,
          (value) => formData.target_timeline === value,
          (value) => handleSingleSelect("target_timeline", value),
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(44,226,208,0.14),transparent_32%),radial-gradient(circle_at_bottom,rgba(184,41,168,0.18),transparent_38%),var(--bg-base)]">
        <PageLoader />
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(44,226,208,0.14),transparent_32%),radial-gradient(circle_at_bottom,rgba(184,41,168,0.18),transparent_38%),var(--bg-base)] px-4 py-10">
        <div
          className="mx-auto max-w-2xl rounded-[2rem] border p-8"
          style={{
            background: "var(--panel-background)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            boxShadow: "var(--card-shadow-strong)",
          }}
        >
          <div className="flex items-center gap-3 text-red-100">
            <CheckCircle2 size={20} className="rotate-180 text-red-300" />
            <h1 className="text-2xl font-semibold">We could not open onboarding</h1>
          </div>
          <p className="mt-4 text-sm leading-7 text-red-100/85">{pageError}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={() => router.refresh()}>
              Try again
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.replace("/signin")}>
              Back to sign in
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(44,226,208,0.14),transparent_32%),radial-gradient(circle_at_bottom,rgba(184,41,168,0.18),transparent_38%),var(--bg-base)] px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-5 shadow-[0_18px_48px_rgba(3,8,20,0.28)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.26em] text-theme-muted">Welcome aboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-theme-main md:text-4xl">
              Let&apos;s personalize your learning journey.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-theme-muted">
              This quick onboarding helps us shape the dashboard, recommendations, and pacing you
              see after sign-in. Only new learners need to complete it.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-sm text-theme-muted">Progress</p>
            <p className="mt-1 text-3xl font-semibold text-theme-main">
              {Math.round(progressValue)}%
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section
            className="rounded-[2rem] border p-6 md:p-8"
            style={{
              background: "linear-gradient(180deg, rgba(19, 30, 50, 0.96), rgba(9, 14, 25, 0.98))",
              borderColor: "rgba(255, 255, 255, 0.08)",
              boxShadow: "var(--card-shadow-strong)",
            }}
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <StepBadge>Step {currentStep + 1}</StepBadge>
                    <StepBadge>{STEP_DEFINITIONS.length} total steps</StepBadge>
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold text-theme-main">
                    {currentStepDefinition.title}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-theme-muted">
                    {currentStepDefinition.description}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.22em] text-theme-muted">
                    Current stage
                  </p>
                  <p className="mt-1 text-base font-medium text-theme-main">
                    {currentStepDefinition.helper}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-theme-muted">
                  <span>Profile completion</span>
                  <span>{Math.round(progressValue)}%</span>
                </div>
                <Progress value={progressValue} className="h-3" />
              </div>

              {stepMessage ? (
                <div className="rounded-[1.4rem] border border-amber-400/18 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  {stepMessage}
                </div>
              ) : null}

              <div className="pt-2">{renderStepContent()}</div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
                disabled={currentStep === 0 || submitting}
              >
                <ArrowLeft size={16} />
                Back
              </Button>

              <div className="flex flex-col gap-3 sm:flex-row">
                {!isFinalStep ? (
                  <Button type="button" onClick={handleNext} disabled={submitting}>
                    Continue
                    <ArrowRight size={16} />
                  </Button>
                ) : (
                  <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Saving your setup...
                      </>
                    ) : (
                      <>
                        Finish onboarding
                        <ArrowRight size={16} />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </section>

          <OnboardingSummary
            formData={formData}
            currentStep={currentStep}
            totalSteps={STEP_DEFINITIONS.length}
          />
        </div>
      </div>
    </div>
  )
}
