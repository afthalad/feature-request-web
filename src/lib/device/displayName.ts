const DISPLAY_NAME_KEY = "fr_display_name";

export function getStoredDisplayName(): string {
  return localStorage.getItem(DISPLAY_NAME_KEY) ?? "";
}

export function setStoredDisplayName(name: string): void {
  localStorage.setItem(DISPLAY_NAME_KEY, name);
}
