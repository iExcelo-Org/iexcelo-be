import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  // passport-oauth2 only sends Google the state passed in here, never the request's own
  // ?state=. Without this the connect token never reached Google, so the callback always
  // ran as a plain login. The strategy verifies the state when Google returns it.
  getAuthenticateOptions(context: ExecutionContext) {
    const { query } = context.switchToHttp().getRequest<Request>();

    // Callback leg: Google sends the state back itself.
    if (query.code !== undefined || query.error !== undefined) return {};

    return typeof query.state === 'string' && query.state
      ? { state: query.state }
      : {};
  }
}
