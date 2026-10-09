export type FeatureStatus = "open" | "planned" | "in_progress" | "done" | "declined";

export const FEATURE_STATUSES: FeatureStatus[] = [
  "open",
  "planned",
  "in_progress",
  "done",
  "declined",
];

export type Plan = "free" | "starter" | "pro";

export type AppPlatformId = "ios" | "android" | "macos" | "desktop" | "web";

export const APP_PLATFORM_IDS: AppPlatformId[] = ["ios", "android", "macos", "desktop", "web"];

export interface AppUser {
  email: string;
  displayName: string;
  photoURL: string;
  plan: Plan;
  createdAt: string;
  dodoCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  billingPeriod?: "monthly" | "yearly" | null;
  nextBillingDate?: string | null;
  emailsSentMonth?: string;
  emailsSentMonthCount?: number;
}

export interface AdminUser extends AppUser {
  uid: string;
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
  hideVoteCounts?: boolean;
  platforms: AppPlatformId[];
  featureCount: number;
  createdAt: string;
  disabled?: boolean;
  disabledSlug?: string | null;
  featuresLastViewedAt?: string | null;
}

export interface FeatureTranslation {
  lang: string;
  title: string;
  description: string;
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
  authorIsSubscriber: boolean;
  translation: FeatureTranslation | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureWithVote extends Feature {
  hasVoted: boolean;
  isFollowing: boolean;
  /** Whether the requesting device submitted this, so SDKs need not compare device ids. */
  isMine: boolean;
}

export interface Follower {
  id: string;
  email: string;
  createdAt: string;
}

export interface RecentFeature extends Feature {
  appId: string;
  appName: string;
  isNew: boolean;
}

export interface DashboardStats {
  totalApps: number;
  totalFeatures: number;
  totalUpvotes: number;
}

export interface Comment {
  id: string;
  text: string;
  authorName: string;
  deviceId: string;
  isDeveloper: boolean;
  createdAt: string;
  /** Set on the SDK path, where the caller knows which device is asking. */
  isMine?: boolean;
}

export interface AdminComment extends Comment {
  isDeleted: boolean;
}

export interface AdminApiKey {
  hash: string;
  appId: string;
  appName: string;
  ownerUid: string;
  active: boolean;
  createdAt: string;
}

export interface AdminWebhookEvent {
  id: string;
  type: string;
  receivedAt: string;
}

export interface AdminAuditLogEntry {
  id: string;
  adminUid: string;
  action: string;
  targetType: string;
  targetId: string;
  before: unknown;
  after: unknown;
  at: string;
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
