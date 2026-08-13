import { Suspense } from "react";
import { UnsubscribeForm } from "@/components/unsubscribe/UnsubscribeForm";

export default function UnsubscribePage() {
  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <Suspense fallback={null}>
        <UnsubscribeForm />
      </Suspense>
    </div>
  );
}
