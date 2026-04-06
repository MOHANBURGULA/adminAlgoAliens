import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp()
    const request = http.getRequest<{ method?: string; originalUrl?: string; url?: string }>()
    const method = request.method || 'UNKNOWN'
    const url = request.originalUrl || request.url || ''
    const startedAt = Date.now()

    return next.handle().pipe(
      tap({
        next: () => {
          const response = http.getResponse<{ statusCode?: number }>()
          const duration = Date.now() - startedAt
          this.logger.log(`${method} ${url} -> ${response.statusCode ?? 200} (${duration}ms)`)
        },
        error: (error) => {
          const duration = Date.now() - startedAt
          const statusCode =
            typeof error?.getStatus === 'function' ? error.getStatus() : 500
          this.logger.warn(`${method} ${url} -> ${statusCode} (${duration}ms)`)
        },
      }),
    )
  }
}
