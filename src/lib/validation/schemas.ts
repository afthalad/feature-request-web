import { z } from "zod";
import { hasAppId } from "@/lib/apps/appIds";

const iosBundleIdSchema = z
  .string()
  .trim()
  .max(155)
  .regex(/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/, "Enter a valid iOS Bundle ID, like com.company.app.");

const androidPackageNameSchema = z
  .string()
  .trim()
  .max(150)
  .regex(
    /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/,
    "Enter a valid Android package name, like com.company.app."
  );

const webDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value.replace(/^https?:\/\//, "").replace(/[/:].*$/, ""))
  .pipe(
    z
      .string()
      .max(253)
      .regex(/^([a-z0-9-]+\.)+[a-z]{2,}$/, "Enter a valid website domain, like company.com.")
  );

const appIdFields = {
  iosBundleId: iosBundleIdSchema.nullable().optional(),
  androidPackageName: androidPackageNameSchema.nullable().optional(),
  webDomain: webDomainSchema.nullable().optional(),
};

const APP_ID_REQUIRED = {
  message: "Add at least one: iOS Bundle ID, Android package name or website domain.",
};

export const createFeatureSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(1000).optional().default(""),
  email: z.string().trim().email().optional(),
  isSubscriber: z.boolean().optional().default(false),
});

export const createAppSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    ...appIdFields,
  })
  .refine(hasAppId, APP_ID_REQUIRED);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only.");

export const updateAppSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  ...appIdFields,
  notificationEmail: z.string().trim().email().optional(),
  emailOnNewRequest: z.boolean().optional(),
  hideVoteCounts: z.boolean().optional(),
  slug: slugSchema.optional(),
});

export const translateFeatureSchema = z.object({
  appId: z.string().trim().min(1),
  targetLang: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .optional()
    .default("en"),
});

export const updateFeatureStatusSchema = z.object({
  appId: z.string().trim().min(1),
  status: z.enum(["open", "planned", "in_progress", "done", "declined"]),
  notify: z.boolean().optional().default(false),
});

export const followFeatureSchema = z.object({
  email: z.string().trim().email(),
});

export const createCommentSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  authorName: z.string().trim().max(60).optional(),
});

export const createSdkCommentSchema = createCommentSchema.extend({
  featureId: z.string().trim().min(1),
});

export const adminUpdateUserPlanSchema = z.object({
  plan: z.enum(["free", "starter", "pro"]),
  subscriptionStatus: z.string().trim().max(60).optional(),
});

export const adminUpdateAppSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  notificationEmail: z.string().trim().email().optional(),
  emailOnNewRequest: z.boolean().optional(),
  disabled: z.boolean().optional(),
  /** Undo an owner's delete. */
  restore: z.literal(true).optional(),
});

export const adminUpdateFeatureSchema = z.object({
  title: z.string().trim().min(3).max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(["open", "planned", "in_progress", "done", "declined"]).optional(),
});

export const adminCreateAppSchema = z
  .object({
    ownerUid: z.string().trim().min(1),
    name: z.string().trim().min(1).max(100),
    ...appIdFields,
    notificationEmail: z.string().trim().email().optional(),
  })
  .refine(hasAppId, APP_ID_REQUIRED);

export const adminCreateFeatureSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(1000).optional().default(""),
  status: z.enum(["open", "planned", "in_progress", "done", "declined"]).optional().default("open"),
});

export const adminCreateCommentSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  authorName: z.string().trim().max(60).optional(),
});

export const adminUpdateCommentSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

export const adminAddFollowerSchema = z.object({
  email: z.string().trim().email(),
});
