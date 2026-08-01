import { realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

function isWithin(root, candidate) {
  const remainder = relative(root, candidate);
  return remainder === "" || (!remainder.startsWith("..") && !isAbsolute(remainder));
}

async function canonicalizeWithExistingAncestor(candidate) {
  const missing = [];
  let current = candidate;
  for (;;) {
    try {
      return resolve(await realpath(current), ...missing.reverse());
    } catch (error) {
      if (current === resolve(current, "..")) throw error;
      missing.push(current.slice(resolve(current, "..").length).replace(/^[\\/]+/, ""));
      current = resolve(current, "..");
    }
  }
}

/** Resolves a prospective mutation through existing symlinks before containment. */
export async function evaluateEvalMutationPath(fixtureRoot, inputPath) {
  if (typeof fixtureRoot !== "string" || !fixtureRoot || typeof inputPath !== "string" || !inputPath.trim()) {
    return { allowed: false, reason: "invalid_path" };
  }
  try {
    const root = await realpath(fixtureRoot);
    const requested = inputPath.trim().replace(/^@/, "");
    const canonicalTarget = await canonicalizeWithExistingAncestor(resolve(root, requested));
    return isWithin(root, canonicalTarget)
      ? { allowed: true, canonicalTarget }
      : { allowed: false, reason: "outside_fixture" };
  } catch {
    return { allowed: false, reason: "unresolvable_path" };
  }
}
