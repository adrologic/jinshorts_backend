/**
 * Content Moderation Service
 *
 * Validates news content against prohibited words and phrases
 * that violate Indian digital norms (IT Act 2000/2008, IPC sections
 * on hate speech, defamation, obscenity) and general editorial standards.
 *
 * Categories:
 * 1. Profanity / Obscenity (IT Act Section 67)
 * 2. Hate speech — communal, religious, caste-based (IPC 153A, 295A, 505)
 * 3. Defamatory / seditious language (IPC 124A, 499, 500)
 * 4. Incitement to violence
 * 5. Misinformation / fake news markers
 */

// Each entry is lowercased. We match whole words (word-boundary aware).
const PROFANITY: string[] = [
  'fuck', 'fucking', 'fucker', 'fck', 'f*ck',
  'shit', 'shitting', 'bullshit', 'sh*t',
  'bastard', 'bitch', 'asshole', 'ass',
  'dick', 'cock', 'pussy', 'cunt',
  'damn', 'dammit', 'motherfucker',
  'whore', 'slut', 'porn', 'pornography',
  'nude', 'nudes', 'xxx', 'sex video',
  // Hindi profanity
  'bhenchod', 'madarchod', 'chutiya', 'gaand', 'lund',
  'randi', 'harami', 'saala', 'kamina', 'bhosdike',
];

const HATE_SPEECH: string[] = [
  // Communal / religious hatred
  'kill all muslims', 'kill all hindus', 'kill all christians',
  'kill all sikhs', 'kill all jains', 'death to muslims',
  'death to hindus', 'death to christians', 'death to sikhs',
  'anti-national', 'anti national',
  'ethnic cleansing', 'genocide',
  // Caste-based slurs
  'chamar', 'bhangi', 'chuhra',
  // Religious slurs
  'jihadi', 'terrorist community', 'rice bag',
  'love jihad', 'land jihad',
];

const VIOLENCE_INCITEMENT: string[] = [
  'kill them all', 'bomb them', 'shoot them',
  'burn them alive', 'lynch them', 'hang them',
  'blood will flow', 'wipe them out',
  'take up arms', 'armed revolution',
];

const MISINFORMATION_MARKERS: string[] = [
  'confirmed by whatsapp', 'whatsapp university',
  'covid is a hoax', 'vaccines cause death',
  'vaccines are poison', 'microchip vaccine',
  '5g causes covid', '5g corona',
];

const DEFAMATORY: string[] = [
  'paid media', 'presstitute', 'presstitutes',
  'godi media',
];

interface ModerationResult {
  isClean: boolean;
  violations: ModerationViolation[];
}

interface ModerationViolation {
  category: 'profanity' | 'hate_speech' | 'violence' | 'misinformation' | 'defamatory';
  word: string;
  field: string;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findViolations(
  text: string,
  field: string,
  wordList: string[],
  category: ModerationViolation['category']
): ModerationViolation[] {
  if (!text) return [];

  const lower = text.toLowerCase();
  const violations: ModerationViolation[] = [];

  for (const word of wordList) {
    // For multi-word phrases, do a simple includes check
    // For single words, use word-boundary matching to avoid false positives
    if (word.includes(' ')) {
      if (lower.includes(word)) {
        violations.push({ category, word, field });
      }
    } else {
      const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
      if (regex.test(lower)) {
        violations.push({ category, word, field });
      }
    }
  }

  return violations;
}

/**
 * Moderates the given text fields of a news article.
 * Returns a result indicating whether the content is clean and any violations found.
 */
export function moderateContent(fields: Record<string, string | undefined>): ModerationResult {
  const violations: ModerationViolation[] = [];

  for (const [field, text] of Object.entries(fields)) {
    if (!text) continue;

    violations.push(
      ...findViolations(text, field, PROFANITY, 'profanity'),
      ...findViolations(text, field, HATE_SPEECH, 'hate_speech'),
      ...findViolations(text, field, VIOLENCE_INCITEMENT, 'violence'),
      ...findViolations(text, field, MISINFORMATION_MARKERS, 'misinformation'),
      ...findViolations(text, field, DEFAMATORY, 'defamatory'),
    );
  }

  return {
    isClean: violations.length === 0,
    violations,
  };
}

/**
 * Returns a user-friendly error message from moderation violations.
 */
export function formatViolationMessage(violations: ModerationViolation[]): string {
  const categoryLabels: Record<ModerationViolation['category'], string> = {
    profanity: 'Profanity / Obscene content',
    hate_speech: 'Hate speech',
    violence: 'Incitement to violence',
    misinformation: 'Misinformation',
    defamatory: 'Defamatory content',
  };

  // Group by category
  const grouped = new Map<string, Set<string>>();
  for (const v of violations) {
    const label = categoryLabels[v.category];
    if (!grouped.has(label)) grouped.set(label, new Set());
    grouped.get(label)!.add(`"${v.word}" in ${v.field}`);
  }

  const parts: string[] = [];
  for (const [category, words] of grouped) {
    parts.push(`${category}: ${Array.from(words).join(', ')}`);
  }

  return `Content moderation failed. Prohibited content detected:\n${parts.join('\n')}`;
}

/**
 * Returns only the prohibited words/phrases for client-side validation.
 * Grouped by category for the API response.
 */
export function getBlockedWordsList() {
  return {
    profanity: PROFANITY,
    hate_speech: HATE_SPEECH,
    violence: VIOLENCE_INCITEMENT,
    misinformation: MISINFORMATION_MARKERS,
    defamatory: DEFAMATORY,
  };
}
