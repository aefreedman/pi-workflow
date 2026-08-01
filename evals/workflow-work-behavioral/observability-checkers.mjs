function serialized(value) {
  return JSON.stringify(value ?? {});
}

function mutationIndexBetween(calls, start, end) {
  return calls.slice(start + 1, end).some((call) => call.name === "write" || call.name === "edit");
}

export function hasFocusedFailureCorrectionPassTrace(calls) {
  const checks = calls.map((call, index) => ({ call, index })).filter(({ call }) => call.name === "work_eval_focused_check");
  const failure = checks.find(({ call }) => /"outcome":"fail"|FOCUSED_CHECK: fail/.test(serialized(call.result)));
  if (!failure) return false;
  const success = checks.find(({ call, index }) => index > failure.index && /"outcome":"pass"|FOCUSED_CHECK: pass/.test(serialized(call.result)));
  return success !== undefined && mutationIndexBetween(calls, failure.index, success.index);
}

export function hasSingleSpecialistDirectVerificationTrace(calls) {
  const specialists = calls.map((call, index) => ({ call, index })).filter(({ call }) => call.name === "work_eval_specialist");
  if (specialists.length !== 1 || calls.some((call) => call.name !== "work_eval_specialist" && /agent|delegate/i.test(call.name))) return false;
  const specialist = specialists[0];
  const verification = calls.findIndex((call, index) => index > specialist.index
    && call.name === "work_eval_focused_check"
    && /"outcome":"pass"|FOCUSED_CHECK: pass/.test(serialized(call.result)));
  return verification > specialist.index && mutationIndexBetween(calls, specialist.index, verification);
}
