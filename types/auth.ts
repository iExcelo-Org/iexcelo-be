export interface TokenPayload {
  email: string;
  sub: string; // userId
  role: string;
  refreshTokenId?: string; // Present on student/sponsor tokens. Absent on admin tokens (which use a separate JWT strategy).
  // Set only on single-use tokens (Google connect state and link). Those are signed with the
  // same secret, so anything that accepts a session token must reject a payload carrying it.
  purpose?: string;
}

export interface ExchangeTokenPayload {
  sub: string; // userId
  purpose?: string; // Must be absent: a connect token is not an exchange token.
}
