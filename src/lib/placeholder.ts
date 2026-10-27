// Unfilled content is marked with [[PREENCHER: ...]] (see README).
// Preview builds show it as-is; production builds drop anything that still has it.
// No imports: this file is also loaded directly by Node from scripts/.

export const PLACEHOLDER_MARKER = '[[PREENCHER';

export function hasPlaceholder(value: unknown): boolean {
  if (typeof value === 'string') return value.includes(PLACEHOLDER_MARKER);
  if (Array.isArray(value)) return value.some(hasPlaceholder);
  if (value && typeof value === 'object') return Object.values(value).some(hasPlaceholder);
  return false;
}

export function isFilled(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim() !== '' && !hasPlaceholder(value);
}

/** Keep items to render: everything non-empty in preview, only fully filled items in production. */
export function shown<T>(items: readonly T[], preview: boolean): T[] {
  return items.filter((item) => item !== '' && (preview || !hasPlaceholder(item)));
}

/** Whether a single string should render. */
export function shows(value: string, preview: boolean): boolean {
  return value.trim() !== '' && (preview || !hasPlaceholder(value));
}

/** Dot paths of every value still holding a placeholder, e.g. "home.faq.items.3.answer". */
export function collectPlaceholders(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return value.includes(PLACEHOLDER_MARKER) ? [path] : [];
  if (Array.isArray(value)) return value.flatMap((v, i) => collectPlaceholders(v, path ? `${path}.${i}` : String(i)));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => collectPlaceholders(v, path ? `${path}.${k}` : k));
  }
  return [];
}
