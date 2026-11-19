import { ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';
import type { Request } from 'express';
import { pickReturnTo } from '../utils/google-return-to';

// Passport only sends Google a state value when it is passed in here, so this guard
// forwards it on the way out. On the way back (the callback) there is nothing to add.
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(
    private readonly config: ConfigService,
    @Optional() options?: AuthModuleOptions,
  ) {
    super(options);
  }

  // passport-oauth2 only sends Google the state passed in here, never the request's own
  // ?state=. Without this the connect token never reached Google, so the callback always
  // ran as a plain login. The strategy verifies the state when Google returns it.
  getAuthenticateOptions(context: ExecutionContext) {
    const { query } = context.switchToHttp().getRequest<Request>();

    // Callback leg: Google sends the state back itself.
    if (query.code !== undefined || query.error !== undefined) return {};

    // Connect flow: the signed token from /auth/google/connect-init.
    if (typeof query.state === 'string' && query.state) {
      return { state: query.state };
    }

    // Sign-in from a staging preview: remember where to send the user back to.
    const returnTo = pickReturnTo(query.returnTo, this.config);
    return returnTo ? { state: returnTo } : {};
  }
}
