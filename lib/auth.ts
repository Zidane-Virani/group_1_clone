import { createServerSupabaseClient } from "@/lib/supabaseClient";

export function getAccessTokenFromRequest(req: Request): string | null {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

export async function getAuthenticatedUser(req: Request) {
  const accessToken = getAccessTokenFromRequest(req);

  if (!accessToken) {
    return { error: "Unauthorized", status: 401 as const };
  }

  const serverSupabase = createServerSupabaseClient(accessToken);
  const {
    data: { user },
    error,
  } = await serverSupabase.auth.getUser(accessToken);

  if (error || !user) {
    return { error: "Unauthorized", status: 401 as const };
  }

  return { accessToken, serverSupabase, user };
}
