import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ActivityType } from '../activity/activity-type.enum'
import {
  EXECUTION_LANGUAGE_CANDIDATES,
  LOCAL_JUDGE0_LANGUAGE_IDS,
  LOCAL_JUDGE0_URL_DEFAULT,
  normalizeExecutionLanguage,
} from './execution-language'

type Judge0Language = {
  id: number
  name: string
}

type Judge0SubmissionResult = {
  compile_output?: string | null
  message?: string | null
  stderr?: string | null
  status?: {
    id: number
    description: string
  }
  stdout?: string | null
  time?: string | null
}

type ExecutionTestCase = {
  input?: string
  output?: string
  isHidden?: boolean
}

type ExecuteActivityInput = {
  activityType: ActivityType
  expectedOutput?: string
  language?: string
  sqlSchema?: string
  sourceCode: string
  testCases?: ExecutionTestCase[]
}

@Injectable()
export class Judge0Service {
  private readonly logger = new Logger(Judge0Service.name)
  private cachedLanguages: Judge0Language[] | null = null
  private languagesFetchedAt = 0
  private readonly languageCacheTtlMs = 5 * 60 * 1000
  private readonly judge0BaseUrl =
    process.env.JUDGE0_URL?.trim() || LOCAL_JUDGE0_URL_DEFAULT

  async executeActivity(input: ExecuteActivityInput) {
    const languageKey = normalizeExecutionLanguage(
      input.language,
      input.activityType === ActivityType.SQL_DEBUGGING ? 'sql' : 'code',
    )
    const languageId = await this.resolveLanguageId(languageKey)

    if (!languageId) {
      throw new BadRequestException(
        `Compiler is not available for language "${input.language || languageKey}" on the local Judge0 instance`,
      )
    }

    const sourceCode =
      input.activityType === ActivityType.SQL_DEBUGGING
        ? this.buildSqlProgram(input.sqlSchema, input.sourceCode)
        : input.sourceCode

    const cases = this.buildTestCases(input.testCases, input.expectedOutput)
    const results: Array<Record<string, unknown>> = []
    let passedTestCases = 0
    let totalExecutionTime = 0
    let latestResult: Judge0SubmissionResult | null = null

    for (const testCase of cases) {
      const execution = await this.runSingleSubmission({
        languageId,
        sourceCode,
        stdin: testCase.input,
        expectedOutput: testCase.output,
      })

      latestResult = execution
      const executionTime = Number.parseFloat(execution.time || '0')
      totalExecutionTime += Number.isFinite(executionTime) ? executionTime : 0

      const output = execution.stdout || ''
      const expected = testCase.output
      const compileOutput = execution.compile_output || ''
      const stderr = execution.stderr || execution.message || ''
      const runtimeFailed = Boolean(compileOutput || stderr)
      const matchesExpected =
        typeof expected === 'string'
          ? this.normalizeOutput(output) === this.normalizeOutput(expected)
          : !runtimeFailed

      if (!runtimeFailed && matchesExpected) {
        passedTestCases += 1
      }

      results.push({
        passed: !runtimeFailed && matchesExpected,
        hidden: Boolean(testCase.isHidden),
        input: testCase.isHidden ? undefined : testCase.input || '',
        expectedOutput: testCase.isHidden ? undefined : expected,
        output,
        errors: stderr || compileOutput || null,
        time: execution.time || '0',
        status: execution.status?.description || 'Unknown',
      })

      if (runtimeFailed) {
        break
      }
    }

    const finalResult = latestResult || {
      stdout: '',
      stderr: '',
      compile_output: '',
      time: '0',
      status: { id: 0, description: 'Not executed' },
    }

    return {
      compiler: languageKey,
      languageId,
      passed: passedTestCases === cases.length,
      score: Math.round((passedTestCases / cases.length) * 100),
      passedTestCases,
      totalTestCases: cases.length,
      output: finalResult.stdout || '',
      errors: finalResult.stderr || finalResult.compile_output || finalResult.message || '',
      executionTime: totalExecutionTime.toFixed(3),
      status: finalResult.status?.description || 'Unknown',
      results,
    }
  }

  private async runSingleSubmission({
    expectedOutput,
    languageId,
    sourceCode,
    stdin,
  }: {
    expectedOutput?: string
    languageId: number
    sourceCode: string
    stdin?: string
  }) {
    const payload = {
      enable_per_process_and_thread_memory_limit: true,
      enable_per_process_and_thread_time_limit: true,
      language_id: languageId,
      source_code: sourceCode,
      stdin: stdin || '',
      expected_output:
        typeof expectedOutput === 'string' ? expectedOutput : undefined,
      cpu_time_limit: 5,
      memory_limit: 256000,
      wall_time_limit: 10,
    }

    return this.requestJudge0<Judge0SubmissionResult>(
      '/submissions?base64_encoded=false&wait=true&fields=stdout,stderr,compile_output,message,status,time',
      {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    )
  }

  private async resolveLanguageId(languageKey: string) {
    try {
      const languages = await this.getLanguages()
      const candidates = EXECUTION_LANGUAGE_CANDIDATES[languageKey] || [languageKey]

      const matched = languages.find((language) => {
        const normalizedName = language.name.trim().toLowerCase()
        return candidates.some((candidate) => normalizedName.includes(candidate))
      })

      return matched?.id || LOCAL_JUDGE0_LANGUAGE_IDS[languageKey] || null
    } catch (error) {
      this.logger.warn(
        `Falling back to static Judge0 language id for "${languageKey}" because /languages is unavailable`,
      )
      return LOCAL_JUDGE0_LANGUAGE_IDS[languageKey] || null
    }
  }

  private async getLanguages() {
    if (
      this.cachedLanguages &&
      Date.now() - this.languagesFetchedAt < this.languageCacheTtlMs
    ) {
      return this.cachedLanguages
    }

    const languages = await this.requestJudge0<Judge0Language[]>('/languages')
    this.cachedLanguages = languages
    this.languagesFetchedAt = Date.now()
    return languages
  }

  private buildTestCases(testCases?: ExecutionTestCase[], expectedOutput?: string) {
    const normalized =
      testCases?.filter(
        (testCase) =>
          typeof testCase.input === 'string' || typeof testCase.output === 'string',
      ) || []

    if (normalized.length > 0) {
      return normalized
    }

    return [
      {
        input: '',
        output: expectedOutput,
      },
    ]
  }

  private buildSqlProgram(sqlSchema: string | undefined, sourceCode: string) {
    this.assertSafeSql(sourceCode)

    const schema = sqlSchema?.trim() ? `${sqlSchema.trim()}\n` : ''
    return `${schema}${sourceCode.trim()}`
  }

  private assertSafeSql(sourceCode: string) {
    const unsafePattern =
      /\b(attach|detach|load_extension)\b|pragma\s+writable_schema|(^|\s)\.(shell|system|read)\b/i

    if (unsafePattern.test(sourceCode)) {
      throw new BadRequestException('Unsafe SQL statement detected')
    }
  }

  private normalizeOutput(value: string) {
    return value.replace(/\r\n/g, '\n').trim()
  }

  private async requestJudge0<T>(path: string, init?: RequestInit) {
    try {
      const response = await fetch(`${this.judge0BaseUrl}${path}`, init)

      if (!response.ok) {
        throw new Error(`Local Judge0 responded with ${response.status}`)
      }

      return (await response.json()) as T
    } catch (error) {
      this.logger.error(
        `Local Judge0 request failed for ${path}`,
        error instanceof Error ? error.stack : String(error),
      )
      throw new ServiceUnavailableException(
        'Local Judge0 service is unavailable. Start the local Judge0 instance and retry.',
      )
    }
  }
}
