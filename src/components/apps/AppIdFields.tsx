"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { UpgradeDialog } from "@/components/billing/UpgradeDialog";
import { APP_PLATFORMS } from "@/lib/appPlatforms";
import { cn } from "@/lib/utils";
import type { AppIds } from "@/lib/apps/appIds";
import type { AppPlatformId } from "@/types";

export type AppIdValues = Record<keyof AppIds, string>;

export const EMPTY_APP_ID_VALUES: AppIdValues = {
  iosBundleId: "",
  androidPackageName: "",
  webDomain: "",
};

const FIELD_BY_PLATFORM: Record<
  AppPlatformId,
  { name: keyof AppIds; label: string; placeholder: string; help: ReactNode }
> = {
  ios: {
    name: "iosBundleId",
    label: "iOS Bundle ID",
    placeholder: "com.yourcompany.app",
    help: (
      <>
        <HelpLine tech="Flutter">
          Open <Code>ios/Runner.xcworkspace</Code> in Xcode, then Runner → General → Bundle
          Identifier.
        </HelpLine>
        <HelpLine tech="SwiftUI">In Xcode: your target → General → Bundle Identifier.</HelpLine>
      </>
    ),
  },
  android: {
    name: "androidPackageName",
    label: "Android package name",
    placeholder: "com.yourcompany.app",
    help: (
      <>
        <HelpLine tech="Flutter">
          <Code>applicationId</Code> in <Code>android/app/build.gradle</Code>.
        </HelpLine>
        <HelpLine tech="Kotlin">
          <Code>applicationId</Code> in <Code>app/build.gradle.kts</Code>.
        </HelpLine>
      </>
    ),
  },
  web: {
    name: "webDomain",
    label: "Website domain",
    placeholder: "yourcompany.com",
    help: <p>Just the domain, without https://. Subdomains work too.</p>,
  },
};

function Code({ children }: { children: ReactNode }) {
  return <code className="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">{children}</code>;
}

function HelpLine({ tech, children }: { tech: string; children: ReactNode }) {
  return (
    <p>
      <span className="text-foreground font-medium">{tech}:</span> {children}
    </p>
  );
}

export function toAppIdValues(appIds: AppIds): AppIdValues {
  return {
    iosBundleId: appIds.iosBundleId ?? "",
    androidPackageName: appIds.androidPackageName ?? "",
    webDomain: appIds.webDomain ?? "",
  };
}

export function toAppIds(values: AppIdValues): AppIds {
  return {
    iosBundleId: values.iosBundleId.trim() || null,
    androidPackageName: values.androidPackageName.trim() || null,
    webDomain: values.webDomain.trim() || null,
  };
}

interface AppIdFieldsProps {
  value: AppIdValues;
  onChange: (value: AppIdValues) => void;
  disabled?: boolean;
  maxPlatforms: number;
}

export function AppIdFields({ value, onChange, disabled, maxPlatforms }: AppIdFieldsProps) {
  const [selected, setSelected] = useState<AppPlatformId[]>(() =>
    APP_PLATFORMS.filter(({ id }) => value[FIELD_BY_PLATFORM[id].name]).map(({ id }) => id)
  );
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [openHelp, setOpenHelp] = useState<AppPlatformId | null>(null);
  const isAtLimit = selected.length >= maxPlatforms;

  function togglePlatform(platform: AppPlatformId) {
    if (selected.includes(platform)) {
      setSelected(selected.filter((id) => id !== platform));
      onChange({ ...value, [FIELD_BY_PLATFORM[platform].name]: "" });
    } else if (isAtLimit) {
      setShowUpgrade(true);
    } else {
      setSelected([...selected, platform]);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <Label>Where does your app run?</Label>
        <div className="flex flex-wrap gap-2">
          {APP_PLATFORMS.map(({ id, label, icon }) => {
            const isSelected = selected.includes(id);
            const isLocked = !isSelected && isAtLimit;
            return (
              <button
                key={id}
                type="button"
                onClick={() => togglePlatform(id)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm transition-colors disabled:opacity-50",
                  isSelected
                    ? "bg-primary/15 text-foreground"
                    : "bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                )}
              >
                {icon.kind === "brand" ? (
                  <BrandIcon path={icon.path} color={icon.color} className="size-3.5" />
                ) : (
                  <icon.Icon className="size-3.5" />
                )}
                {label}
                {isLocked && <Lock className="size-3" />}
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs">
          {maxPlatforms > 1
            ? "Pick every place your app runs. Flutter apps usually pick iOS and Android."
            : "Free apps work on one platform. Upgrade to add more to the same app."}
        </p>
      </div>
      {APP_PLATFORMS.filter(({ id }) => selected.includes(id)).map(({ id }) => {
        const field = FIELD_BY_PLATFORM[id];
        return (
          <div key={id} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              value={value[field.name]}
              onChange={(event) => onChange({ ...value, [field.name]: event.target.value })}
              placeholder={field.placeholder}
              maxLength={253}
              disabled={disabled}
              required
            />
            {openHelp === id ? (
              <div className="text-muted-foreground bg-surface space-y-1 rounded-lg p-3 text-xs leading-5">
                {field.help}
                <Link
                  href="/docs/concepts#app-ids"
                  target="_blank"
                  className="text-foreground inline-block underline underline-offset-4"
                >
                  See the full guide
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOpenHelp(id)}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                Where do I find this?
              </button>
            )}
          </div>
        );
      })}
      <UpgradeDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        title="Add more platforms"
        description="Free apps work on one platform. Upgrade to add iOS, Android and web to the same app."
      />
    </div>
  );
}
