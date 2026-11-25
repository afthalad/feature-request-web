const IN_APP_BROWSER_PATTERN = /LinkedInApp|FBAN|FBAV|Instagram|Twitter/i;

export function isInAppBrowser(userAgent: string) {
  return IN_APP_BROWSER_PATTERN.test(userAgent);
}
