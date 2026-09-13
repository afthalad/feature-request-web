export function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return email;

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  const maskedLength = Math.min(Math.max(local.length - 1, 3), 6);

  return `${local[0]}${"*".repeat(maskedLength)}${domain}`;
}
