// One place that decides which browser origins may call the API. Used by CORS in main.ts
// and by the Google sign-in return address, so both always agree.
//
// Reads three settings (all optional):
//   FRONTEND_URL        e.g. https://iexcelo.com
//   ADMIN_URL           e.g. https://admin.iexcelo.com
//   CORS_EXTRA_ORIGINS  any others, separated by commas or spaces. An entry like
//                       https://*.app.iexcelo.com allows exactly one subdomain level:
//                       https://fix-login.app.iexcelo.com yes, https://a.b.app.iexcelo.com no.

export interface OriginRules {
  exact: string[];
  wildcards: { prefix: string; suffix: string; label: string }[];
}

export function loadOriginRules(
  get: (key: string) => string | undefined,
): OriginRules {
  const entries = [
    get('FRONTEND_URL'),
    get('ADMIN_URL'),
    ...(get('CORS_EXTRA_ORIGINS') ?? '').split(/[\s,]+/),
  ]
    .map((u) => (u ?? '').trim().replace(/\/$/, ''))
    .filter(Boolean);
  const unique = [...new Set(entries)];

  return {
    exact: unique.filter((o) => !o.includes('://*.')),
    wildcards: unique
      .filter((o) => o.includes('://*.'))
      .map((o) => {
        const [scheme, rest] = o.split('://*.');
        return { prefix: `${scheme}://`, suffix: `.${rest}`, label: o };
      }),
  };
}

export function isAllowedOrigin(
  origin: string | undefined,
  rules: OriginRules,
): boolean {
  if (!origin) return false;
  if (rules.exact.includes(origin)) return true;
  return rules.wildcards.some((w) => {
    if (!origin.startsWith(w.prefix) || !origin.endsWith(w.suffix))
      return false;
    const sub = origin.slice(w.prefix.length, origin.length - w.suffix.length);
    return /^[a-z0-9-]{1,63}$/.test(sub); // exactly one DNS label, nothing sneaky
  });
}

export function describeOriginRules(rules: OriginRules): string {
  return [...rules.exact, ...rules.wildcards.map((w) => w.label)].join(', ');
}
