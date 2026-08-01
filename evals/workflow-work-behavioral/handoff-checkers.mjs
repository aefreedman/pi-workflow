export function hasWorkHandoffEvidence(answer) {
  if (typeof answer !== "string" || answer.trim().length < 120) return false;
  return [
    /\b(?:changed|updated|modified)\b[\s\S]{0,180}\b(?:file|behavior|importer)\b/i,
    /\bvalidation\b/i,
    /\b(?:skipped checks?|intentionally (?:unrun|skipped))\b/i,
    /\b(?:unauthorized external actions?|external actions?)\b/i,
  ].every((pattern) => pattern.test(answer));
}
