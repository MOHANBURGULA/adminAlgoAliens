import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DataSource } from 'typeorm'
import JSON5 from 'json5'
import { MongoClient } from 'mongodb'
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from './code-execution.constants'

type Judge0SubmissionResponse = {
  compile_output?: string | null
  memory?: number | null
  message?: string | null
  status?: { id: number; description: string } | null
  stderr?: string | null
  stdout?: string | null
  time?: string | null
  token?: string | null
}

export type CodeExecutionRequest = {
  expectedOutput?: string
  languageId?: number
  languageKey?: string
  languageName?: string
  sourceCode: string
  stdin?: string
}

export type CodeExecutionResponse = {
  error: string
  memory?: number | null
  output: string
  status?: string
  success: boolean
  time?: string | null
}

const FORBIDDEN_SQL_PATTERNS = [
  /\bALTER\b/i,
  /\bBEGIN\b/i,
  /\bCOMMIT\b/i,
  /\bCOPY\b/i,
  /\bCREATE\s+EXTENSION\b/i,
  /\bDELETE\b/i,
  /\bDROP\b/i,
  /\bGRANT\b/i,
  /\bLISTEN\b/i,
  /\bNOTIFY\b/i,
  /\bREASSIGN\b/i,
  /\bREINDEX\b/i,
  /\bRESET\b/i,
  /\bREVOKE\b/i,
  /\bROLLBACK\b/i,
  /\bSET\b/i,
  /\bTRUNCATE\b/i,
  /\bUPDATE\b/i,
  /\bVACUUM\b/i,
]

const MONGO_METHODS = new Set([
  'aggregate',
  'countDocuments',
  'distinct',
  'find',
  'findOne',
])

@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name)
  private mongoClientPromise: Promise<MongoClient> | null = null

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  getCompilerLanguages() {
    return SUPPORTED_LANGUAGES
      .map((language) => ({ ...language }))
      .sort((left, right) => left.order - right.order)
  }

  async runCodeActivity(payload: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    const sourceCode = payload.sourceCode?.trim()
    if (!sourceCode) {
      return {
        success: false,
        output: '',
        error: 'Source code is required.',
      }
    }

    const language = this.resolveLanguage(payload)
    if (!language) {
      return {
        success: false,
        output: '',
        error: 'A valid language selection is required.',
      }
    }

    switch (language.engine) {
      case 'judge0':
        return this.runJudge0Execution(language, payload, sourceCode)
      case 'sql':
        return this.runSqlExecution(sourceCode)
      case 'mongodb':
        return this.runMongoExecution(sourceCode)
    }
  }

  private resolveLanguage(payload: CodeExecutionRequest) {
    const key = payload.languageKey?.trim().toLowerCase()
    if (key) {
      return SUPPORTED_LANGUAGES.find((language) => language.key === key)
    }

    if (Number.isFinite(Number(payload.languageId))) {
      return SUPPORTED_LANGUAGES.find(
        (language) => language.judge0Id === Number(payload.languageId),
      )
    }

    const name = payload.languageName?.trim().toLowerCase()
    if (name) {
      return SUPPORTED_LANGUAGES.find((language) => language.name.toLowerCase() === name)
    }

    return null
  }

  private async runJudge0Execution(
    language: SupportedLanguage,
    payload: CodeExecutionRequest,
    sourceCode: string,
  ): Promise<CodeExecutionResponse> {
    if (!language.judge0Id) {
      return {
        success: false,
        output: '',
        error: `Language ${language.name} is missing a Judge0 id.`,
      }
    }

    try {
      const result = await this.requestJudge0<Judge0SubmissionResponse>(
        '/submissions?base64_encoded=false&wait=true',
        {
          method: 'POST',
          body: JSON.stringify({
            language_id: language.judge0Id,
            source_code: sourceCode,
            stdin: typeof payload.stdin === 'string' ? payload.stdin : undefined,
            expected_output:
              typeof payload.expectedOutput === 'string' && payload.expectedOutput.trim()
                ? payload.expectedOutput
                : undefined,
          }),
        },
      )

      const error =
        result.compile_output?.trim() ||
        result.stderr?.trim() ||
        result.message?.trim() ||
        ''
      const output = result.stdout?.trim() || ''

      return {
        success: !error,
        output,
        error,
        status: result.status?.description || '',
        time: result.time ?? null,
        memory: result.memory ?? null,
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: this.extractErrorMessage(error),
        status: 'Judge0 execution failed',
      }
    }
  }

  private async runSqlExecution(sourceCode: string): Promise<CodeExecutionResponse> {
    try {
      this.ensureSafeSql(sourceCode)

      const statements = this.splitSqlStatements(sourceCode)
      if (statements.length === 0) {
        return {
          success: false,
          output: '',
          error: 'Add at least one SQL statement to run.',
        }
      }

      const queryRunner = this.dataSource.createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction()

      try {
        let lastResult: unknown = null

        for (const statement of statements) {
          lastResult = await queryRunner.query(statement)
        }

        await queryRunner.rollbackTransaction()

        return {
          success: true,
          output: this.formatStructuredOutput(lastResult, 'SQL executed successfully.'),
          error: '',
          status: 'SQL sandbox completed',
        }
      } catch (error) {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction()
        }

        return {
          success: false,
          output: '',
          error: this.extractErrorMessage(error),
          status: 'SQL sandbox failed',
        }
      } finally {
        await queryRunner.release()
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: this.extractErrorMessage(error),
        status: 'SQL sandbox blocked',
      }
    }
  }

  private async runMongoExecution(sourceCode: string): Promise<CodeExecutionResponse> {
    try {
      const parsedQuery = this.parseMongoQuery(sourceCode)
      const database = await this.getMongoDatabase()
      const collection = database.collection(parsedQuery.collection)

      switch (parsedQuery.method) {
        case 'find': {
          const filter = this.parseMongoArgument(parsedQuery.arguments[0], {})
          const projection = this.parseMongoArgument(parsedQuery.arguments[1], undefined)
          const cursor = projection
            ? collection.find(filter, { projection })
            : collection.find(filter)
          const rows = await cursor.limit(50).toArray()
          return {
            success: true,
            output: this.formatStructuredOutput(rows, 'No MongoDB documents matched.'),
            error: '',
            status: 'MongoDB query completed',
          }
        }
        case 'findOne': {
          const filter = this.parseMongoArgument(parsedQuery.arguments[0], {})
          const projection = this.parseMongoArgument(parsedQuery.arguments[1], undefined)
          const row = await collection.findOne(filter, projection ? { projection } : undefined)
          return {
            success: true,
            output: this.formatStructuredOutput(row, 'No MongoDB document matched.'),
            error: '',
            status: 'MongoDB query completed',
          }
        }
        case 'aggregate': {
          const pipeline = this.parseMongoArgument(parsedQuery.arguments[0], [])
          if (!Array.isArray(pipeline)) {
            throw new BadRequestException('MongoDB aggregate expects an array pipeline.')
          }
          const rows = await collection.aggregate(pipeline).limit(50).toArray()
          return {
            success: true,
            output: this.formatStructuredOutput(rows, 'MongoDB aggregate returned no rows.'),
            error: '',
            status: 'MongoDB query completed',
          }
        }
        case 'countDocuments': {
          const filter = this.parseMongoArgument(parsedQuery.arguments[0], {})
          const count = await collection.countDocuments(filter)
          return {
            success: true,
            output: String(count),
            error: '',
            status: 'MongoDB query completed',
          }
        }
        case 'distinct': {
          const fieldName = this.parseMongoArgument(parsedQuery.arguments[0], '')
          if (typeof fieldName !== 'string' || !fieldName.trim()) {
            throw new BadRequestException('MongoDB distinct expects a field name string.')
          }
          const filter = this.parseMongoArgument(parsedQuery.arguments[1], {})
          const values = await collection.distinct(fieldName, filter)
          return {
            success: true,
            output: this.formatStructuredOutput(values, 'MongoDB distinct returned no values.'),
            error: '',
            status: 'MongoDB query completed',
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: this.extractErrorMessage(error),
        status: 'MongoDB query failed',
      }
    }
  }

  private ensureSafeSql(sourceCode: string) {
    const sanitized = this.stripSqlComments(sourceCode)

    const forbiddenPattern = FORBIDDEN_SQL_PATTERNS.find((pattern) => pattern.test(sanitized))
    if (forbiddenPattern) {
      throw new BadRequestException(
        'Unsafe SQL blocked. Only sandbox-friendly CREATE/INSERT/SELECT style statements are allowed.',
      )
    }
  }

  private stripSqlComments(sourceCode: string) {
    return sourceCode
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim()
  }

  private splitSqlStatements(sourceCode: string) {
    const statements: string[] = []
    let current = ''
    let quote: "'" | '"' | '`' | null = null

    for (let index = 0; index < sourceCode.length; index += 1) {
      const character = sourceCode[index]
      const previousCharacter = index > 0 ? sourceCode[index - 1] : ''

      if (quote) {
        current += character
        if (character === quote && previousCharacter !== '\\') {
          quote = null
        }
        continue
      }

      if (character === "'" || character === '"' || character === '`') {
        quote = character
        current += character
        continue
      }

      if (character === ';') {
        const trimmed = current.trim()
        if (trimmed) {
          statements.push(trimmed)
        }
        current = ''
        continue
      }

      current += character
    }

    const trailing = current.trim()
    if (trailing) {
      statements.push(trailing)
    }

    return statements
  }

  private parseMongoQuery(sourceCode: string) {
    const normalized = sourceCode.trim().replace(/;$/, '')
    const match = normalized.match(
      /^db\.([A-Za-z0-9_-]+)\.(find|findOne|aggregate|countDocuments|distinct)\(([\s\S]*)\)$/i,
    )

    if (!match) {
      throw new BadRequestException(
        'MongoDB execution expects a query like db.users.find({...}) or db.users.aggregate([...]).',
      )
    }

    const [, collection, method, rawArguments] = match
    const normalizedMethod = method.trim()
    if (!MONGO_METHODS.has(normalizedMethod)) {
      throw new BadRequestException('That MongoDB method is not allowed in the sandbox.')
    }

    return {
      collection,
      method: normalizedMethod as
        | 'aggregate'
        | 'countDocuments'
        | 'distinct'
        | 'find'
        | 'findOne',
      arguments: this.splitTopLevelArguments(rawArguments),
    }
  }

  private splitTopLevelArguments(rawArguments: string) {
    if (!rawArguments.trim()) {
      return []
    }

    const parts: string[] = []
    let current = ''
    let depth = 0
    let quote: "'" | '"' | '`' | null = null

    for (let index = 0; index < rawArguments.length; index += 1) {
      const character = rawArguments[index]
      const previousCharacter = index > 0 ? rawArguments[index - 1] : ''

      if (quote) {
        current += character
        if (character === quote && previousCharacter !== '\\') {
          quote = null
        }
        continue
      }

      if (character === "'" || character === '"' || character === '`') {
        quote = character
        current += character
        continue
      }

      if (character === '{' || character === '[' || character === '(') {
        depth += 1
        current += character
        continue
      }

      if (character === '}' || character === ']' || character === ')') {
        depth -= 1
        current += character
        continue
      }

      if (character === ',' && depth === 0) {
        parts.push(current.trim())
        current = ''
        continue
      }

      current += character
    }

    const trailing = current.trim()
    if (trailing) {
      parts.push(trailing)
    }

    return parts
  }

  private parseMongoArgument<T>(value: string | undefined, fallback: T) {
    if (!value || !value.trim()) {
      return fallback
    }

    try {
      return JSON5.parse(value) as T
    } catch {
      throw new BadRequestException(
        'MongoDB arguments must be valid JSON-like values. Example: { active: true }',
      )
    }
  }

  private async getMongoDatabase() {
    const mongoUri = this.configService.get<string>('MONGODB_EXECUTION_URI')?.trim()
    const mongoDatabase = this.configService.get<string>('MONGODB_EXECUTION_DATABASE')?.trim()

    if (!mongoUri || !mongoDatabase) {
      throw new ServiceUnavailableException(
        'Set MONGODB_EXECUTION_URI and MONGODB_EXECUTION_DATABASE in admin-backend/.env to run MongoDB queries.',
      )
    }

    if (!this.mongoClientPromise) {
      const client = new MongoClient(mongoUri)
      this.mongoClientPromise = client.connect().catch((error) => {
        this.mongoClientPromise = null
        throw error
      })
    }

    const client = await this.mongoClientPromise
    return client.db(mongoDatabase)
  }

  private formatStructuredOutput(value: unknown, emptyFallback: string) {
    if (value == null) {
      return emptyFallback
    }

    if (Array.isArray(value) && value.length === 0) {
      return emptyFallback
    }

    if (typeof value === 'string') {
      return value || emptyFallback
    }

    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  private extractErrorMessage(error: unknown) {
    if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) {
      const response = error.getResponse()
      if (typeof response === 'string') {
        return response
      }

      if (response && typeof response === 'object') {
        const message = (response as { message?: unknown }).message
        if (Array.isArray(message)) {
          return message.join(', ')
        }
        if (typeof message === 'string') {
          return message
        }
      }
    }

    if (error instanceof Error) {
      return error.message
    }

    return 'Execution failed.'
  }

  private getJudge0BaseUrl() {
    const judge0BaseUrl = this.configService.get<string>('JUDGE0_BASE_URL')?.trim().replace(/\/$/, '')
    if (!judge0BaseUrl) {
      throw new ServiceUnavailableException('Missing JUDGE0_BASE_URL in admin-backend/.env')
    }
    return judge0BaseUrl
  }

  private async requestJudge0<T>(path: string, init?: RequestInit) {
    const judge0BaseUrl = this.getJudge0BaseUrl()
    let response: Response

    try {
      response = await fetch(`${judge0BaseUrl}${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init?.method && init.method !== 'GET'
            ? { 'Content-Type': 'application/json' }
            : {}),
          ...(init?.headers || {}),
        },
      })
    } catch {
      this.logger.warn(`Judge0 request failed for ${judge0BaseUrl}${path}`)
      throw new ServiceUnavailableException(
        `Unable to reach local Judge0 at ${judge0BaseUrl}. Start your local Judge0 service and try again.`,
      )
    }

    const rawBody = await response.text()
    const payload = this.parseJudge0Payload(rawBody)

    if (!response.ok) {
      if (payload && typeof payload === 'object') {
        const errorMessage =
          (payload as { error?: unknown; message?: unknown }).error ??
          (payload as { error?: unknown; message?: unknown }).message

        if (typeof errorMessage === 'string' && errorMessage.trim()) {
          throw new BadRequestException(errorMessage)
        }
      }

      throw new BadRequestException('Local Judge0 request failed.')
    }

    return payload as T
  }

  private parseJudge0Payload(rawBody: string) {
    if (!rawBody) {
      return null
    }

    try {
      return JSON.parse(rawBody)
    } catch {
      return { message: rawBody }
    }
  }
}
