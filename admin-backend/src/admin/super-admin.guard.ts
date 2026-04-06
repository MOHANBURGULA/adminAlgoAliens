// src/admin/super-admin.guard.ts
// Protects routes so only users with role === 'superadmin' can access them.
// Used on top of JwtAuthGuard (JWT must be valid first, then this checks the role).

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user    = request.user   // set by JwtAuthGuard via JwtStrategy.validate()

    if (!user) {
      throw new ForbiddenException('No authenticated user found')
    }

    if (user.role !== 'superadmin') {
      throw new ForbiddenException('Access denied. Super Admin only.')
    }

    return true
  }
}