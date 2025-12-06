import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../../decorators/public.decorator';
import { REQUIRE_API_KEY } from '../../../decorators/requireApiKey.decorator';
import { REQUIRE_PERMISSIONS_KEY } from '../../../decorators/requirePermissions.decorator';
import { ROLES_KEY } from '../../../decorators/roles.decorator';
import { UserRole } from '../../../entities/user.entity';
import { IUser, IUserPayload } from '../../../types/express';
import { ApiKeyService } from '../../api-key/api-key.service';
import { UserService } from '../../user/user.service';

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly userService: UserService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const class_ref = context.getClass();
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Check if the route is marked as Public
    const is_public = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      class_ref,
    ]);
    if (is_public) return true;

    // Check if API key authentication is required or provided
    const requireApiKey = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_API_KEY,
      [handler, class_ref],
    );

    const apiKeyHeader = request.headers['x-api-key'] as string;

    // If API key is provided, try API key authentication first
    if (apiKeyHeader) {
      const validatedKey =
        await this.apiKeyService.validateApiKey(apiKeyHeader);
      if (validatedKey) {
        request['apiKey'] = {
          id: validatedKey.id,
          permissions: validatedKey.permissions,
          serviceName: validatedKey.serviceName,
        };

        // Check if specific permissions are required
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
          REQUIRE_PERMISSIONS_KEY,
          [handler, class_ref],
        );

        if (requiredPermissions && requiredPermissions.length > 0) {
          const hasAllPermissions = requiredPermissions.every((permission) =>
            validatedKey.permissions.includes(permission),
          );

          if (!hasAllPermissions) {
            throw new UnauthorizedException(
              `Missing required permissions: ${requiredPermissions.join(', ')}`,
            );
          }
        }

        return true;
      }
      // If API key provided but invalid, throw error
      throw new UnauthorizedException('Invalid API key');
    }

    // If API key is required but not provided, throw error
    if (requireApiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Fall back to JWT authentication
    const token = this.extract_token_from_header(request);

    if (!token) {
      throw new UnauthorizedException('Missing auth token');
    }

    let payload: IUserPayload | null = null;
    try {
      // Verify token
      payload = await this.jwtService.verifyAsync<IUserPayload>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid auth token');
    }

    const user = await this.userService.getUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request['user'] = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // Check if specific roles are required
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [handler, class_ref],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(user.role);
      if (!hasRole) {
        throw new UnauthorizedException(
          `Access denied. Required role: ${requiredRoles.join(' or ')}`,
        );
      }
    }

    return true;
  }

  private extract_token_from_header(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
