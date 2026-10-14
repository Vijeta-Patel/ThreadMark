// STUB. Allows every request. Bharti replaces the body with real Supabase Auth
// session checking in P2-B2 and keeps this contract:
//   - return { id } for a logged-in manufacturer
//   - throw UnauthorizedError when there is no valid session
// Routes catch UnauthorizedError and answer 401 { error: "unauthorized" }.

export class UnauthorizedError extends Error {
  constructor(message = "unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export interface AuthedUser {
  /** Supabase user id; null while this stub is in place. */
  id: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function requireUser(_request: Request): Promise<AuthedUser> {
  return { id: null };
}
