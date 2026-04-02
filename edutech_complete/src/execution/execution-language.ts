export const LOCAL_JUDGE0_URL_DEFAULT = 'http://127.0.0.1:2358'

export const LOCAL_JUDGE0_LANGUAGE_IDS: Partial<Record<string, number>> = {
  c: 50,
  cpp: 54,
  java: 62,
  javascript: 63,
  nodejs: 63,
  python: 70,
  python3: 71,
  typescript: 74,
  sql: 82,
}

export const EXECUTION_LANGUAGE_CANDIDATES: Record<string, string[]> = {
  c: ['c ', 'gcc', 'gnu c'],
  cpp: ['c++', 'g++'],
  java: ['java'],
  javascript: ['javascript', 'node.js'],
  nodejs: ['node.js', 'javascript'],
  python: ['python 2', 'python (2', 'python'],
  python3: ['python 3', 'python (3'],
  typescript: ['typescript'],
  html: ['html'],
  css: ['css'],
  sql: ['sqlite'],
}

export function normalizeExecutionLanguage(
  value: string | undefined,
  fallback: 'code' | 'sql',
) {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, '')

  if (!normalized) {
    return fallback === 'sql' ? 'sql' : 'python3'
  }

  if (normalized === 'c++') return 'cpp'
  if (normalized === 'python3' || normalized === 'python-3') return 'python3'
  if (normalized === 'python') return 'python'
  if (normalized === 'node' || normalized === 'node.js') return 'nodejs'
  if (normalized === 'js') return 'javascript'
  if (normalized === 'ts') return 'typescript'
  if (normalized === 'sql' || normalized === 'sqlite') return 'sql'

  return normalized
}
