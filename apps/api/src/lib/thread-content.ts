export const modelThreadBreakToken = "<<<THREAD_BREAK>>>";
export const storedThreadSeparator = "\n\n---\n\n";

function cleanSegment(text: string) {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export function serializeThreadSegments(segments: string[]) {
  return segments.map(cleanSegment).filter(Boolean).join(storedThreadSeparator);
}

export function parseThreadSegments(
  content: string,
  fallbackSegments: string[] = []
) {
  const cleanedContent = cleanSegment(content);

  if (cleanedContent.includes(modelThreadBreakToken)) {
    return cleanedContent
      .split(modelThreadBreakToken)
      .map(cleanSegment)
      .filter(Boolean);
  }

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

export function resolvePostThreadSegments(input: {
  editedContent?: string | null;
  generatedContent: string;
  generationNotes?: {
    thread_segments?: unknown;
  } | null;
}) {
  const fallbackSegments = Array.isArray(input.generationNotes?.thread_segments)
    ? input.generationNotes?.thread_segments.filter(
        (value): value is string => typeof value === "string"
      )
    : [];

  const content = input.editedContent?.trim() || input.generatedContent;

  return parseThreadSegments(content, fallbackSegments);
}
