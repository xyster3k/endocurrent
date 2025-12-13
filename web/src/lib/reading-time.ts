export function estimateReadingTime(content: string) {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 215));
  return { minutes, words };
}
