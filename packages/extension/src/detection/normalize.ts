const leetMap: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
  '!': 'i',
};

/**
 * Normalize text for fast rule matching.
 * Lowercases, applies NFKC fold, strips zero-width chars, and converts leetspeak.
 */
export function foldBasic(input: string): string {
  let s = input.normalize('NFKC').toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '');
  const wordChar = /[a-z0-9]/;
  s = s.replace(/[013457@$!]/g, (char, index, full) => {
    const mapped = leetMap[char];
    if (!mapped) return char;
    const prev = index > 0 ? full[index - 1] : '';
    const next = index + 1 < full.length ? full[index + 1] : '';
    const shouldMap = wordChar.test(prev) || wordChar.test(next);
    return shouldMap ? mapped : char;
  });
  return s;
}

/**
 * Replace high-signal emoji with textual hints to boost regex recall.
 */
export function emojiHints(s: string): string {
  return s
    .replace(/📞|☎️/g, ' phone ')
    .replace(/📱/g, ' phone ')
    .replace(/📷|📸/g, ' photo ')
    .replace(/🤫/g, ' dont tell ')
    .replace(/👉/g, ' move ');
}
