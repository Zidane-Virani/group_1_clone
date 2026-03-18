import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
    );
  }

  return { url, anonKey };
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const { url, anonKey } = getSupabaseConfig();
    browserClient = createClient(url, anonKey);
  }

  return browserClient;
}

export function createServerSupabaseClient(
  accessToken?: string
): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();

  return createClient(
    url,
    anonKey,
    accessToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      : undefined
  );
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseBrowserClient() as unknown as Record<
      string | symbol,
      unknown
    >)[prop];
  },
});
