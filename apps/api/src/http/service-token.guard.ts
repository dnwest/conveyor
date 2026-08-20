import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type { Env } from '../config/env.schema';

export const SERVICE_TOKEN_HEADER = 'x-service-token';

// Write endpoints are not called from the browser: the console proxies them
// through its own server, which authorises the operator and then presents this
// token. Read endpoints stay public so the hosted Swagger remains explorable.
@Injectable()
export class ServiceTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const presented = request.header(SERVICE_TOKEN_HEADER) ?? '';
    const expected = this.config.get('SERVICE_TOKEN', { infer: true });

    if (!matches(presented, expected)) {
      throw new UnauthorizedException('A valid service token is required');
    }
    return true;
  }
}

// Digesting first keeps the comparison constant-time regardless of length.
function matches(presented: string, expected: string): boolean {
  return timingSafeEqual(digest(presented), digest(expected));
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}
