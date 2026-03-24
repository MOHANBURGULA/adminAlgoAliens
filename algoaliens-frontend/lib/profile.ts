export type UserProfileData = {
  skillLevel: string
  interests: string[]
  goal?: string
}

export function normalizeUserProfile(
  payload: Partial<UserProfileData> | null | undefined,
): UserProfileData {
  return {
    skillLevel: payload?.skillLevel || "",
    interests: Array.isArray(payload?.interests) ? payload.interests.filter(Boolean) : [],
    goal: payload?.goal || "",
  }
}
