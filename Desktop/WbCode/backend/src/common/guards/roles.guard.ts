import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../constants/roles';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const rawRole = user?.role?.name ?? user?.role;
    const userRole = typeof rawRole === 'string' ? rawRole.toUpperCase() : rawRole;

    // Normalize required roles too (defensive: enum values are already uppercase strings)
    const required = requiredRoles.map((r) => (typeof r === 'string' ? r.toUpperCase() : r));

    const allowed = required.includes(userRole as any);
    if (!allowed) {
      throw new ForbiddenException(
        `Access denied. Required role: ${required.join(', ')}. Your role: ${userRole ?? 'UNKNOWN'}.`
      );
    }

    return true;
  }
}

















