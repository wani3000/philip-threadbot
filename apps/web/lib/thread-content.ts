const storedThreadSeparator = "\n\n---\n\n";

function cleanSegment(text: string) {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export function splitStoredThreadContent(
  content: string,
  fallbackSegments: string[] = []
) {
  const cleanedContent = cleanSegment(content);

  if (cleanedContent.includes(storedThreadSeparator)) {
    return cleanedContent
      .split(storedThreadSeparator)
      .map(cleanSegment)
      .filter(Boolean);
  }

  if (fallbackSegments.length > 0) {
    return fallbackSegments.map(cleanSegment).filter(Boolean);
  }

  return cleanedContent ? [cleanedContent] : [];
}
