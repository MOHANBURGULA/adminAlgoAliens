import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { QueryFailedError } from 'typeorm'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const { statusCode, message, details } = this.normalizeException(exception)

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode} ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      )
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${statusCode} ${message}`)
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      details,
      path: request.url,
      timestamp: new Date().toISOString(),
    })
  }

  private normalizeException(exception: unknown) {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus()
      const payload = exception.getResponse()

      if (typeof payload === 'string') {
        return { statusCode, message: payload, details: null }
      }

      if (payload && typeof payload === 'object') {
        const candidate = payload as { message?: string | string[]; error?: string }
        const message = Array.isArray(candidate.message)
          ? candidate.message.join(', ')
          : candidate.message || candidate.error || exception.message

        return {
          statusCode,
          message,
          details: Array.isArray(candidate.message) ? candidate.message : null,
        }
      }
    }

    if (exception instanceof QueryFailedError) {
      const driverError = (exception as QueryFailedError & {
        driverError?: { code?: string; detail?: string; message?: string }
      }).driverError
      const code = driverError?.code

      if (code === '42703') {
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database schema mismatch detected. Run pending migrations and restart the backend.',
          details: driverError?.message ?? null,
        }
      }

      if (code === '23505') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'A record with the same unique value already exists.',
          details: driverError?.detail ?? null,
        }
      }

      if (code === '23503') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'The requested change violates a related record constraint.',
          details: driverError?.detail ?? null,
        }
      }

      if (code === '22P02') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid database input.',
          details: driverError?.message ?? null,
        }
      }
    }

    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message || 'Internal server error',
        details: null,
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      details: null,
    }
  }
}
