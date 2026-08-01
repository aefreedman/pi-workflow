export function hasImplementationReadyPlanDraft(answer) {
  if (typeof answer !== "string" || answer.trim().length < 200) return false;
  const required = [
    /\b(?:Minimal|Standard|Comprehensive)\b/i,
    /\b(?:rationale|because|selected)\b/i,
    /\b(?:evidence|current behavior|source)\b/i,
    /\b(?:design|implementation|approach)\b/i,
    /\b(?:validation|test)\b/i,
    /\b429\b/,
    /\b5xx\b/i,
    /\b(?:three|3)\s+(?:total\s+)?attempts?\b/i,
    /\b(?:bounded|maximum|cap|limit)\b/i,
    /\b(?:exponential\s+backoff|backoff)\b/i,
  ];
  return required.every((pattern) => pattern.test(answer));
}
