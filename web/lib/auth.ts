// Supabase Auth session checking implementation for Bharti (P2-B2).
// Contract:
//   - return { id } for a logged-in manufacturer
//   - throw UnauthorizedError when there is no valid session
// Routes catch UnauthorizedError and answer 401 { error: "unauthorized" }.

import { getServerSupabase } from "./supabase";

export class UnauthorizedError extends Error {
  constructor(message = "unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export interface AuthedUser {
  id: string | null;
}

/**
 * Checks for user authentication using Supabase Auth via Bearer token or cookie.
 * Throws UnauthorizedError if unauthenticated.
 */
export async function requireUser(request: Request): Promise<AuthedUser> {
  const authHeader = request.headers.get("authorization");
  let token: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/sb-access-token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
  }

  if (!token) {
    throw new UnauthorizedError("Please log in to continue.");
  }

  try {
    const supabase = getServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedError("Please log in to continue.");
    }

    return { id: user.id };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError("Please log in to continue.");
  }
}