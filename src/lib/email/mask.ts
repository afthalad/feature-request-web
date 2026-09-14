export function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return email;

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  const maskedLength = Math.min(Math.max(local.length - 1, 3), 6);

  return `${local[0]}${"*".repeat(maskedLength)}${domain}`;
}

// Reveals the first `visibleChars` and blots out the rest with asterisks — used to tease
// content that's over a plan's limit without giving away what it actually says.
export function maskText(text: string, visibleChars = 2): string {
  if (text.length <= visibleChars) return text;
  return `${text.slice(0, visibleChars)}${"*".repeat(text.length - visibleChars)}`;
}
