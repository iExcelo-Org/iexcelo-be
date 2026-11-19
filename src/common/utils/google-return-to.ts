// Lets Google sign-in return to the preview it started from, on STAGING ONLY.
// Production always returns to FRONTEND_URL, exactly as before.
//
// Sign-in:  a preview links to {API}/auth/google?returnTo=https://fix-login.app.iexcelo.com
//           -> GoogleAuthGuard puts that address in the OAuth state
//           -> Google sends the user to the fixed GOOGLE_CALLBACK_URL with the state attached
//           -> the callback redirects to resolveReturnTo(...)
// Connect:  /auth/google/connect-init?returnTo=... puts the address inside the signed connect
//           token, so it travels the same way without a second state value.
//
// The address is checked against the CORS rules when it goes in and again when it comes out,
// so it can never send anyone to a site outside iexcelo.com.

import { ConfigService } from '@nestjs/config';
import { isAllowedOrigin, loadOriginRules } from './allowed-origins';

const isStaging = (config: ConfigService) =>
  config.get<string>('APP_ENV') === 'staging';

/** The candidate address if this is staging and it passes the origin rules, otherwise undefined. */
export function pickReturnTo(
  candidate: unknown,
  config: ConfigService,
): string | undefined {
  if (!isStaging(config) || typeof candidate !== 'string') return undefined;
  const rules = loadOriginRules((k) => config.get<string>(k));
  return isAllowedOrigin(candidate, rules) ? candidate : undefined;
}

/** Where the Google callback should send the user: the checked candidate, or FRONTEND_URL. */
export function resolveReturnTo(
  candidate: unknown,
  config: ConfigService,
): string {
  const fallback = (config.get<string>('FRONTEND_URL') ?? '').replace(
    /\/$/,
    '',
  );
  return pickReturnTo(candidate, config) ?? fallback;
}
