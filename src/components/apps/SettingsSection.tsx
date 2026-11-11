import type { ReactNode } from "react";

interface SettingsSectionProps {
  /** Lets other pages link straight to this section, e.g. `settings#api-key`. */
  id?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

export function SettingsSection({ id, title, description, children }: SettingsSectionProps) {
  return (
    <section id={id} className="scroll-mt-20 space-y-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {children}
    </section>
  );
}
