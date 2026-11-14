/**
 * Runs `fn` once the page has loaded and the browser is idle, so non-essential
 * scripts (analytics, the header's sign-in check) don't compete with the first
 * paint or the visitor's first tap. Returns a cancel function.
 */
export function whenIdle(fn: () => void, timeout = 4000): () => void {
  if (typeof window === "undefined") return () => {};
  let cancelled = false;
  let idleId: number | undefined;
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const schedule = () => {
    if (cancelled) return;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => !cancelled && fn(), { timeout });
    } else {
      timerId = setTimeout(() => !cancelled && fn(), 1500);
    }
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    if (timerId !== undefined) clearTimeout(timerId);
  };
}
