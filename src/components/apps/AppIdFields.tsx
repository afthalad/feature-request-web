"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandIcon } from "@/components/marketing/BrandIcon";
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
}

export function AppIdFields({ value, onChange, disabled }: AppIdFieldsProps) {
  const [selected, setSelected] = useState<AppPlatformId[]>(() =>
    APP_PLATFORMS.filter(({ id }) => value[FIELD_BY_PLATFORM[id].name]).map(({ id }) => id)
  );

  function togglePlatform(platform: AppPlatformId) {
    if (selected.includes(platform)) {
      setSelected(selected.filter((id) => id !== platform));
      onChange({ ...value, [FIELD_BY_PLATFORM[platform].name]: "" });
    } else {
      setSelected([...selected, platform]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Where does your app run?</Label>
        <div className="flex flex-wrap gap-2">
          {APP_PLATFORMS.map(({ id, label, icon }) => {
            const isSelected = selected.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => togglePlatform(id)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {icon.kind === "brand" ? (
                  <BrandIcon path={icon.path} color={icon.color} className="size-3.5" />
                ) : (
                  <icon.Icon className="size-3.5" />
                )}
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs">
          Pick every place your app runs. Flutter apps usually pick iOS and Android.
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
            <div className="text-muted-foreground space-y-1 text-xs leading-5">{field.help}</div>
          </div>
        );
      })}
      {selected.length > 0 && (
        <p className="text-muted-foreground text-xs">
          Your API key only works in the apps and websites you add here. Not sure where to find
          an ID?{" "}
          <Link
            href="/docs/concepts#app-ids"
            target="_blank"
            className="text-foreground underline underline-offset-4"
          >
            See the guide
          </Link>
          .
        </p>
      )}
    </div>
  );
}
