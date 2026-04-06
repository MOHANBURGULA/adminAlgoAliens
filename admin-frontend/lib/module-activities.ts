export type ModuleActivityType = "sql_debugging" | "coding" | "analysis" | "quiz"

export type ExecutionEngine = "judge0" | "sql" | "mongodb"

export type CompilerLanguage = {
  description: string
  engine: ExecutionEngine
  judge0Id: number | null
  key: string
  monacoLanguage: string
  name: string
  order: number
  starterCode: string
}

export type ActivityTestCase = {
  id: string
  input: string
  expectedOutput: string
  isHidden: boolean
  explanation: string
}

export type QuizQuestion = {
  id: string
  question: string
  options: string[]
  correctOptionIndex: number
  explanation: string
}

export type CodingActivityConfig = {
  executionInput: string
  expectedOutput: string
  instructions: string
  languageEngine: ExecutionEngine | ""
  languageId: number | null
  languageKey: string
  languageName: string
  starterCode: string
  testCases: ActivityTestCase[]
}

export type SqlDebuggingActivityConfig = {
  expectedOutput: string
  hiddenNotes: string
  problemDescription: string
  schema: string
  starterQuery: string
  testCases: ActivityTestCase[]
}

export type AnalysisActivityConfig = {
  guidance: string
  prompt: string
  rubric: string
}

export type QuizActivityConfig = {
  questions: QuizQuestion[]
}

export type ModuleActivityConfig =
  | CodingActivityConfig
  | SqlDebuggingActivityConfig
  | AnalysisActivityConfig
  | QuizActivityConfig

export type ModuleActivityDraft = {
  id?: number
  moduleId: number
  title: string
  description: string
  activityType: ModuleActivityType
  orderIndex: number
  config: ModuleActivityConfig
  createdAt?: string
  updatedAt?: string
}

export type CodeExecutionResult = {
  error: string
  memory?: number | null
  output: string
  status?: string
  success: boolean
  time?: string | null
}

const LEGACY_LANGUAGE_IDS: Record<number, string> = {
  50: "c",
  54: "cpp",
  60: "go",
  62: "java",
  63: "javascript",
  71: "python",
  73: "rust",
  80: "r",
  83: "swift",
  85: "prolog",
}

const STARTER_CODE: Record<string, string> = {
  c: [
    "#include <stdio.h>",
    "",
    "int main(void) {",
    "  // Read input and solve the problem",
    '  printf("Hello from C\\\\n");',
    "  return 0;",
    "}",
  ].join("\n"),
  cpp: [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "int main() {",
    "  ios::sync_with_stdio(false);",
    "  cin.tie(nullptr);",
    "",
    "  // Read input and solve the problem",
    '  cout << "Hello from C++" << "\\\\n";',
    "  return 0;",
    "}",
  ].join("\n"),
  java: [
    "import java.io.*;",
    "import java.util.*;",
    "",
    "public class Main {",
    "  public static void main(String[] args) throws Exception {",
    "    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));",
    "    // Read input and solve the problem",
    '    System.out.println("Hello from Java");',
    "  }",
    "}",
  ].join("\n"),
  python: [
    "def solve() -> None:",
    "    # Read input and solve the problem",
    "    print('Hello from Python')",
    "",
    "if __name__ == '__main__':",
    "    solve()",
  ].join("\n"),
  javascript: [
    "const fs = require('fs')",
    "",
    "const input = fs.readFileSync(0, 'utf8').trim()",
    "// Parse input and solve the problem",
    "console.log('Hello from Node.js')",
  ].join("\n"),
  go: [
    "package main",
    "",
    'import "fmt"',
    "",
    "func main() {",
    '    fmt.Println("Hello from Go")',
    "}",
  ].join("\n"),
  rust: [
    "fn main() {",
    '    println!("Hello from Rust");',
    "}",
  ].join("\n"),
  swift: [
    "import Foundation",
    "",
    'print("Hello from Swift")',
  ].join("\n"),
  r: [
    "# Read input and solve the problem",
    'cat("Hello from R\\\\n")',
  ].join("\n"),
  prolog: [
    "% Define your predicates and query here.",
    "main :-",
    "    writeln('Hello from Prolog').",
  ].join("\n"),
  sql: [
    "-- SQL playground template",
    "CREATE TEMP TABLE users (",
    "  id INT PRIMARY KEY,",
    "  name VARCHAR(100),",
    "  course VARCHAR(100)",
    ");",
    "",
    "INSERT INTO users (id, name, course) VALUES",
    "  (1, 'Ada Lovelace', 'Algorithms'),",
    "  (2, 'Grace Hopper', 'Core Engineering'),",
    "  (3, 'Linus Torvalds', 'Systems');",
    "",
    "SELECT id, name, course",
    "FROM users",
    "WHERE course = 'Algorithms';",
  ].join("\n"),
  mongodb: [
    "// MongoDB read-only query template",
    "db.users.find(",
    "  { active: true },",
    "  { _id: 0, name: 1, email: 1 }",
    ")",
  ].join("\n"),
}

function createLocalId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeLanguageKey(value: unknown) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : ""

  if (!normalized) return ""
  if (normalized === "c++") return "cpp"
  if (normalized === "javascript / node.js" || normalized === "node.js" || normalized === "node") {
    return "javascript"
  }
  if (normalized === "nosql" || normalized === "nosql (mongodb)" || normalized === "mongo" || normalized === "mongodb") {
    return "mongodb"
  }

  return normalized
}

function inferExecutionEngine(languageKey: string) {
  if (languageKey === "sql") return "sql" satisfies ExecutionEngine
  if (languageKey === "mongodb") return "mongodb" satisfies ExecutionEngine
  return "judge0" satisfies ExecutionEngine
}

function isExecutionEngine(value: unknown): value is ExecutionEngine {
  return value === "judge0" || value === "sql" || value === "mongodb"
}

function resolveLegacyLanguageKey(languageId: unknown, languageName: unknown) {
  if (typeof languageId === "number" && LEGACY_LANGUAGE_IDS[languageId]) {
    return LEGACY_LANGUAGE_IDS[languageId]
  }

  return normalizeLanguageKey(languageName)
}

export function createEmptyTestCase(): ActivityTestCase {
  return {
    id: createLocalId("case"),
    input: "",
    expectedOutput: "",
    isHidden: false,
    explanation: "",
  }
}

export function createEmptyQuizQuestion(): QuizQuestion {
  return {
    id: createLocalId("question"),
    question: "",
    options: ["", "", "", ""],
    correctOptionIndex: 0,
    explanation: "",
  }
}

function createEmptyCodingConfig(): CodingActivityConfig {
  return {
    executionInput: "",
    expectedOutput: "",
    instructions:
      "Explain the expected approach, important constraints, and what learners should verify before submitting.",
    languageEngine: "",
    languageId: null,
    languageKey: "",
    languageName: "",
    starterCode: "",
    testCases: [createEmptyTestCase()],
  }
}

function createEmptySqlConfig(): SqlDebuggingActivityConfig {
  return {
    expectedOutput: "customer_id | full_name | orders_count\n1 | Ada Lovelace | 3",
    hiddenNotes: "",
    problemDescription:
      "Find the bug in the SQL logic and return the requested result set. Learners should inspect the schema, sample rows, and the provided query.",
    schema:
      "CREATE TABLE customers (\n  id INT PRIMARY KEY,\n  full_name VARCHAR(100)\n);\n\nCREATE TABLE orders (\n  id INT PRIMARY KEY,\n  customer_id INT,\n  amount DECIMAL(10,2)\n);\n\nINSERT INTO customers (id, full_name) VALUES\n  (1, 'Ada Lovelace'),\n  (2, 'Grace Hopper');",
    starterQuery:
      "-- Debug or complete the SQL below\nSELECT c.id AS customer_id, c.full_name, COUNT(o.id) AS orders_count\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id, c.full_name;",
    testCases: [createEmptyTestCase()],
  }
}

function createEmptyAnalysisConfig(): AnalysisActivityConfig {
  return {
    guidance:
      "Learners should provide a structured explanation, support claims with evidence, and address tradeoffs clearly.",
    prompt: "Write your analysis of the given case study...",
    rubric:
      "Score for clarity, depth of reasoning, correctness, and use of concrete examples or evidence.",
  }
}

function createEmptyQuizConfig(): QuizActivityConfig {
  return {
    questions: [createEmptyQuizQuestion()],
  }
}

export function createConfigByType(activityType: ModuleActivityType): ModuleActivityConfig {
  switch (activityType) {
    case "coding":
      return createEmptyCodingConfig()
    case "sql_debugging":
      return createEmptySqlConfig()
    case "analysis":
      return createEmptyAnalysisConfig()
    case "quiz":
      return createEmptyQuizConfig()
  }
}

export function createEmptyActivity(
  moduleId: number,
  orderIndex: number,
  activityType: ModuleActivityType = "coding",
): ModuleActivityDraft {
  return {
    moduleId,
    title: "",
    description: "",
    activityType,
    orderIndex,
    config: createConfigByType(activityType),
  }
}

function normalizeActivityType(value: unknown): ModuleActivityType {
  if (value === "sql_debugging" || value === "coding" || value === "analysis" || value === "quiz") {
    return value
  }

  return "coding"
}

function parseTestCases(value: unknown): ActivityTestCase[] {
  if (!Array.isArray(value)) {
    return [createEmptyTestCase()]
  }

  const parsedCases = value.map((entry) => {
    const caseValue = typeof entry === "object" && entry !== null ? entry : {}

    return {
      id:
        typeof (caseValue as { id?: unknown }).id === "string"
          ? (caseValue as { id: string }).id
          : createLocalId("case"),
      input:
        typeof (caseValue as { input?: unknown }).input === "string"
          ? (caseValue as { input: string }).input
          : "",
      expectedOutput:
        typeof (caseValue as { expectedOutput?: unknown }).expectedOutput === "string"
          ? (caseValue as { expectedOutput: string }).expectedOutput
          : "",
      isHidden: Boolean((caseValue as { isHidden?: unknown }).isHidden),
      explanation:
        typeof (caseValue as { explanation?: unknown }).explanation === "string"
          ? (caseValue as { explanation: string }).explanation
          : "",
    }
  })

  return parsedCases.length > 0 ? parsedCases : [createEmptyTestCase()]
}

function parseQuizQuestions(value: unknown): QuizQuestion[] {
  if (!Array.isArray(value)) {
    return [createEmptyQuizQuestion()]
  }

  const questions = value.map((entry) => {
    const questionValue = typeof entry === "object" && entry !== null ? entry : {}
    const rawOptions = Array.isArray((questionValue as { options?: unknown[] }).options)
      ? (questionValue as { options: unknown[] }).options
          .map((option) => (typeof option === "string" ? option : ""))
          .slice(0, 6)
      : ["", "", "", ""]

    return {
      id:
        typeof (questionValue as { id?: unknown }).id === "string"
          ? (questionValue as { id: string }).id
          : createLocalId("question"),
      question:
        typeof (questionValue as { question?: unknown }).question === "string"
          ? (questionValue as { question: string }).question
          : "",
      options: rawOptions.length > 0 ? rawOptions : ["", "", "", ""],
      correctOptionIndex: Number(
        (questionValue as { correctOptionIndex?: unknown }).correctOptionIndex || 0,
      ),
      explanation:
        typeof (questionValue as { explanation?: unknown }).explanation === "string"
          ? (questionValue as { explanation: string }).explanation
          : "",
    }
  })

  return questions.length > 0 ? questions : [createEmptyQuizQuestion()]
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function hydrateCodingConfig(config: unknown): CodingActivityConfig {
  const safeConfig = asRecord(config)
  const defaults = createEmptyCodingConfig()
  const languageKey =
    normalizeLanguageKey(safeConfig.languageKey) ||
    resolveLegacyLanguageKey(safeConfig.languageId, safeConfig.languageName)
  const languageEngine =
    isExecutionEngine(safeConfig.languageEngine)
      ? safeConfig.languageEngine
      : languageKey
        ? inferExecutionEngine(languageKey)
        : defaults.languageEngine

  return {
    executionInput:
      typeof safeConfig.executionInput === "string" ? safeConfig.executionInput : "",
    expectedOutput:
      typeof safeConfig.expectedOutput === "string" ? safeConfig.expectedOutput : "",
    instructions:
      typeof safeConfig.instructions === "string"
        ? safeConfig.instructions
        : defaults.instructions,
    languageEngine,
    languageId: typeof safeConfig.languageId === "number" ? safeConfig.languageId : null,
    languageKey,
    languageName:
      typeof safeConfig.languageName === "string" ? safeConfig.languageName : "",
    starterCode:
      typeof safeConfig.starterCode === "string" && safeConfig.starterCode.trim()
        ? safeConfig.starterCode
        : getStarterTemplateForLanguage(languageKey),
    testCases: parseTestCases(safeConfig.testCases),
  }
}

function hydrateSqlConfig(config: unknown): SqlDebuggingActivityConfig {
  const safeConfig = asRecord(config)
  const defaults = createEmptySqlConfig()

  return {
    expectedOutput:
      typeof safeConfig.expectedOutput === "string"
        ? safeConfig.expectedOutput
        : defaults.expectedOutput,
    hiddenNotes: typeof safeConfig.hiddenNotes === "string" ? safeConfig.hiddenNotes : "",
    problemDescription:
      typeof safeConfig.problemDescription === "string"
        ? safeConfig.problemDescription
        : defaults.problemDescription,
    schema: typeof safeConfig.schema === "string" ? safeConfig.schema : defaults.schema,
    starterQuery:
      typeof safeConfig.starterQuery === "string"
        ? safeConfig.starterQuery
        : defaults.starterQuery,
    testCases: parseTestCases(safeConfig.testCases),
  }
}

function hydrateAnalysisConfig(config: unknown): AnalysisActivityConfig {
  const safeConfig = asRecord(config)
  const defaults = createEmptyAnalysisConfig()

  return {
    guidance:
      typeof safeConfig.guidance === "string" ? safeConfig.guidance : defaults.guidance,
    prompt: typeof safeConfig.prompt === "string" ? safeConfig.prompt : defaults.prompt,
    rubric: typeof safeConfig.rubric === "string" ? safeConfig.rubric : defaults.rubric,
  }
}

function hydrateQuizConfig(config: unknown): QuizActivityConfig {
  const safeConfig = asRecord(config)
  return {
    questions: parseQuizQuestions(safeConfig.questions),
  }
}

export function hydrateModuleActivity(rawValue: unknown): ModuleActivityDraft {
  const raw = asRecord(rawValue)
  const activityType = normalizeActivityType(raw.activityType)

  let config: ModuleActivityConfig
  switch (activityType) {
    case "coding":
      config = hydrateCodingConfig(raw.config)
      break
    case "sql_debugging":
      config = hydrateSqlConfig(raw.config)
      break
    case "analysis":
      config = hydrateAnalysisConfig(raw.config)
      break
    case "quiz":
      config = hydrateQuizConfig(raw.config)
      break
  }

  return {
    id: typeof raw.id === "number" ? raw.id : undefined,
    moduleId: Number(raw.moduleId || 0),
    title: typeof raw.title === "string" ? raw.title : "",
    description: typeof raw.description === "string" ? raw.description : "",
    activityType,
    orderIndex: Number(raw.orderIndex || 1),
    config,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  }
}

export function buildModuleActivityPayload(activity: ModuleActivityDraft) {
  return {
    moduleId: activity.moduleId,
    title: activity.title.trim(),
    description: activity.description.trim(),
    activityType: activity.activityType,
    orderIndex: activity.orderIndex,
    config: activity.config,
  }
}

export function validateModuleActivity(activity: ModuleActivityDraft) {
  if (!activity.title.trim()) {
    return "Activity title is required."
  }

  if (!Number.isFinite(activity.orderIndex) || activity.orderIndex < 1) {
    return "Order index must be 1 or greater."
  }

  switch (activity.activityType) {
    case "coding": {
      const config = activity.config as CodingActivityConfig
      if (!config.languageKey.trim()) {
        return "Choose a compiler language."
      }
      if (!config.starterCode.trim()) {
        return "Starter code is required for coding activities."
      }
      return null
    }
    case "sql_debugging": {
      const config = activity.config as SqlDebuggingActivityConfig
      if (!config.problemDescription.trim()) {
        return "Add the SQL problem description."
      }
      if (!config.schema.trim()) {
        return "Add the schema or setup SQL."
      }
      if (!config.starterQuery.trim()) {
        return "Add the starter or buggy SQL query."
      }
      return null
    }
    case "analysis": {
      const config = activity.config as AnalysisActivityConfig
      if (!config.prompt.trim()) {
        return "Add the analysis prompt."
      }
      return null
    }
    case "quiz": {
      const config = activity.config as QuizActivityConfig
      if (config.questions.length === 0) {
        return "Add at least one quiz question."
      }

      const invalidQuestion = config.questions.find((question) => {
        const filledOptions = question.options.filter((option) => option.trim())
        return !question.question.trim() || filledOptions.length < 2
      })

      if (invalidQuestion) {
        return "Each quiz question needs text and at least two filled options."
      }

      return null
    }
  }
}

export function getActivityTypeLabel(activityType: ModuleActivityType) {
  switch (activityType) {
    case "coding":
      return "Coding"
    case "sql_debugging":
      return "SQL Debugging"
    case "analysis":
      return "Analysis"
    case "quiz":
      return "Quiz"
  }
}

export function findCompilerLanguage(
  languages: CompilerLanguage[],
  selection: {
    languageId?: number | null
    languageKey?: string
    languageName?: string
  },
): CompilerLanguage | null {
  const normalizedKey = normalizeLanguageKey(selection.languageKey)
  if (normalizedKey) {
    const languageByKey = languages.find((language) => language.key === normalizedKey)
    if (languageByKey) {
      return languageByKey
    }
  }

  if (typeof selection.languageId === "number") {
    const languageById = languages.find((language) => language.judge0Id === selection.languageId)
    if (languageById) {
      return languageById
    }
  }

  const normalizedName = normalizeLanguageKey(selection.languageName)
  if (normalizedName) {
    return (
      languages.find(
        (language) =>
          language.key === normalizedName || normalizeLanguageKey(language.name) === normalizedName,
      ) || null
    )
  }

  return null
}

export function getMonacoLanguage(languageName: string, languageKey = "") {
  const normalizedKey = normalizeLanguageKey(languageKey)
  if (normalizedKey) {
    if (normalizedKey === "mongodb") return "javascript"
    if (normalizedKey === "sql") return "sql"
    if (normalizedKey === "cpp") return "cpp"
    if (normalizedKey === "c") return "c"
    if (normalizedKey === "java") return "java"
    if (normalizedKey === "python") return "python"
    if (normalizedKey === "javascript") return "javascript"
    if (normalizedKey === "go") return "go"
    if (normalizedKey === "rust") return "rust"
    if (normalizedKey === "swift") return "swift"
    if (normalizedKey === "r") return "r"
    if (normalizedKey === "prolog") return "plaintext"
  }

  const normalizedName = languageName.toLowerCase()
  if (normalizedName.includes("python")) return "python"
  if (normalizedName.includes("javascript")) return "javascript"
  if (normalizedName.includes("java")) return "java"
  if (normalizedName.includes("c++")) return "cpp"
  if (normalizedName === "c" || normalizedName.startsWith("c ")) return "c"
  if (normalizedName.includes("go")) return "go"
  if (normalizedName.includes("rust")) return "rust"
  if (normalizedName.includes("swift")) return "swift"
  if (normalizedName === "r") return "r"
  if (normalizedName.includes("sql")) return "sql"

  return "plaintext"
}

export function getStarterTemplateForLanguage(languageKey: string, languageName = "") {
  const normalizedKey = normalizeLanguageKey(languageKey)
  if (normalizedKey && STARTER_CODE[normalizedKey]) {
    return STARTER_CODE[normalizedKey]
  }

  const legacyKey = resolveLegacyLanguageKey(undefined, languageName)
  if (legacyKey && STARTER_CODE[legacyKey]) {
    return STARTER_CODE[legacyKey]
  }

  return "// Write your solution here"
}

export function sortCompilerLanguages(languages: CompilerLanguage[]) {
  return [...languages].sort((left, right) => {
    const orderDifference = left.order - right.order
    if (orderDifference !== 0) {
      return orderDifference
    }

    return left.name.localeCompare(right.name)
  })
}
