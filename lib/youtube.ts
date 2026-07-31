export function extractYouTubeId(input: string | null): string | null {
  if (!input) return null;
  if (input.startsWith("REPLACE")) return null;
  const trimmed = input.trim();

  // Bare 11-character video ID (typical YouTube ID shape)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "") || null;
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return url.pathname.split("/embed/")[1];
      return url.searchParams.get("v");
    }
  } catch {
    // not a valid URL — fall through
  }
  return null;
}
