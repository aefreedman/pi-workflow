export async function importWithRetry(source: string, attempts = 3): Promise<string> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(source).then((response) => response.text());
    } catch (error) {
      if (attempt === attempts) throw error;
    }
  }
  throw new Error("unreachable");
}
