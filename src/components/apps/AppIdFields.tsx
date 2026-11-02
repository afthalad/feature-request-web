"use client";

import { useState } from "react";
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
  { name: keyof AppIds; label: string; placeholder: string; hint: string }
> = {
  ios: {
    name: "iosBundleId",
    label: "iOS Bundle ID",
    placeholder: "com.yourcompany.app",
    hint: "In Xcode: your target → General → Bundle Identifier.",
  },
  android: {
    name: "androidPackageName",
    label: "Android package name",
    placeholder: "com.yourcompany.app",
    hint: "The applicationId in your app's build.gradle.",
  },
  web: {
    name: "webDomain",
    label: "Website domain",
    placeholder: "yourcompany.com",
    hint: "The website where the board shows. Subdomains work too.",
  },
};

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
            <p className="text-muted-foreground text-xs">{field.hint}</p>
          </div>
        );
      })}
      {selected.length > 0 && (
        <p className="text-muted-foreground text-xs">
          Your API key only works in the apps and websites you add here.
        </p>
      )}
    </div>
  );
}
