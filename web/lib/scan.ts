// Turns the text read from a QR code into a Product ID.
// ThreadMark QR codes hold the verification URL (".../verify/<pid>"), but a bare PID is accepted too.
// Returns null when the text is not a ThreadMark code.

const PID_PATTERN = /^TM-[A-Z0-9]{10}$/;

export function pidFromQrText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/verify\/([^/]+)\/?$/);
    if (!match) return null;
    candidate = decodeURIComponent(match[1]);
  } catch {
    // Not a URL: treat the text itself as the PID.
  }

  const pid = candidate.toUpperCase();
  return PID_PATTERN.test(pid) ? pid : null;
}
