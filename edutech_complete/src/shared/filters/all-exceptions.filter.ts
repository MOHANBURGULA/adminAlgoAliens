import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const response = context.getResponse<Response>()
    const request = context.getRequest<Request>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null

    const normalized = this.normalizeMessage(exceptionResponse, exception)

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} failed`,
        exception instanceof Error ? exception.stack : String(exception),
      )
    }

    response.status(status).json({
      statusCode: status,
      message: normalized.message,
      error: normalized.error,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }

  private normalizeMessage(exceptionResponse: unknown, exception: unknown) {
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const responseMessage = (exceptionResponse as { message?: unknown }).message
      const responseError = (exceptionResponse as { error?: unknown }).error

      return {
        message: this.toMessageValue(responseMessage),
        error:
          typeof responseError === 'string'
            ? responseError
            : exception instanceof HttpException
              ? HttpStatus[exception.getStatus()] || 'Http Error'
              : 'Internal Server Error',
      }
    }

    if (exception instanceof HttpException) {
      return {
        message: exception.message || 'Request failed',
        error: HttpStatus[exception.getStatus()] || 'Http Error',
      }
    }

    return {
      message: 'An unexpected error occurred',
      error: 'Internal Server Error',
    }
  }

  private toMessageValue(value: unknown) {
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry))
    }

    if (typeof value === 'string' && value.trim()) {
      return value
    }

    return 'Request failed'
  }
}
