"use client";

import { APP_PLATFORMS } from "@/lib/appPlatforms";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { cn } from "@/lib/utils";
import type { AppPlatformId } from "@/types";

interface PlatformPickerProps {
  value: AppPlatformId[];
  onChange: (value: AppPlatformId[]) => void;
  disabled?: boolean;
}

export function PlatformPicker({ value, onChange, disabled }: PlatformPickerProps) {
  function toggle(id: AppPlatformId) {
    if (disabled) return;
    onChange(value.includes(id) ? value.filter((platform) => platform !== id) : [...value, id]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {APP_PLATFORMS.map(({ id, label, icon }) => {
        const selected = value.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            disabled={disabled}
            aria-pressed={selected}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
              selected
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
  );
}
