export type FeatureStatus = "open" | "planned" | "in_progress" | "done" | "declined";

export const FEATURE_STATUSES: FeatureStatus[] = [
  "open",
  "planned",
  "in_progress",
  "done",
  "declined",
];

export type Plan = "free" | "pro";

export interface AppUser {
  email: string;
  displayName: string;
  photoURL: string;
  plan: Plan;
  createdAt: string;
}

export interface App {
  id: string;
  ownerUid: string;
  name: string;
  bundleId: string;
  slug: string;
  apiKeyPrefix: string;
  notificationEmail: string;
  emailOnNewRequest: boolean;
  featureCount: number;
  createdAt: string;
}

export const NOTIFIABLE_STATUSES: FeatureStatus[] = ["planned", "in_progress", "done", "declined"];

export interface Feature {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  upvoteCount: number;
  commentCount: number;
  followerCount: number;
  authorDeviceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureWithVote extends Feature {
  hasVoted: boolean;
  isFollowing: boolean;
}

export interface Comment {
  id: string;
  text: string;
  authorName: string;
  deviceId: string;
  isDeveloper: boolean;
  createdAt: string;
}

export type ApiErrorCode =
  | "invalid_key"
  | "missing_device_id"
  | "validation_failed"
  | "rate_limited"
  | "not_found"
  | "internal"
  | "unauthorized"
  | "forbidden"
  | "limit_reached";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}
