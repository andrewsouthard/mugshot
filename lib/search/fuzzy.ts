/** Levenshtein distance, giving up early once it's over `max`. */
export function editDistance(a: string, b: string, max = Infinity): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > max) return max + 1;
    previous = current;
  }
  return previous[b.length];
}

/** Typos allowed for a query word: none under 4 letters, 1 for 4–7, 2 for 8+. */
export function allowedTypos(word: string): number {
  if (word.length < 4) return 0;
  return word.length < 8 ? 1 : 2;
}

/** Whether `term` is within its typo allowance of any of `words`. */
export function fuzzyMatches(term: string, words: string[]): boolean {
  const max = allowedTypos(term);
  if (max === 0) return false;
  return words.some((word) => editDistance(term, word, max) <= max);
}
