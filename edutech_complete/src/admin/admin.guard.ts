import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common'

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name)

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      method?: string
      originalUrl?: string
      user?: { id?: number; role?: string }
    }>()
    const user = request.user

    if (!user || user.role !== 'admin') {
      this.logger.warn(
        `Guard rejection method=${request.method || 'UNKNOWN'} path=${request.originalUrl || 'UNKNOWN'} userId=${user?.id ?? 'unknown'} role=${user?.role ?? 'missing'}`,
      )
      throw new ForbiddenException('Admin access only.')
    }
    return true
  }
}
