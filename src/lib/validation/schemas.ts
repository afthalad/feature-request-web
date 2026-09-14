import { z } from "zod";
import { APP_PLATFORM_IDS } from "@/types";

const platformsSchema = z
  .array(z.enum(APP_PLATFORM_IDS as [string, ...string[]]))
  .max(APP_PLATFORM_IDS.length);

export const createFeatureSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(1000).optional().default(""),
  email: z.string().trim().email().optional(),
  isSubscriber: z.boolean().optional().default(false),
});

export const createAppSchema = z.object({
  name: z.string().trim().min(1).max(100),
  bundleId: z.string().trim().min(1).max(200),
  platforms: platformsSchema.optional().default([]),
});

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only.");

export const updateAppSchema = z.object({
  notificationEmail: z.string().trim().email().optional(),
  emailOnNewRequest: z.boolean().optional(),
  hideVoteCounts: z.boolean().optional(),
  platforms: platformsSchema.optional(),
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
});

export const adminUpdateFeatureSchema = z.object({
  title: z.string().trim().min(3).max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(["open", "planned", "in_progress", "done", "declined"]).optional(),
});
