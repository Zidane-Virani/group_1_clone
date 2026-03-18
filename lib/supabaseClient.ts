import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return { url, anonKey };
}

function isMissingConfig() {
  const { url, anonKey } = getSupabaseConfig();
  return !url || !anonKey;
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    if (isMissingConfig()) {
      // During build/prerender, return a dummy proxy that won't throw
      return new Proxy({} as SupabaseClient, {
        get() {
          return () => ({ data: null, error: { message: "Supabase not configured" } });
        },
      });
    }
    const { url, anonKey } = getSupabaseConfig();
    browserClient = createClient(url, anonKey);
  }

  return browserClient;
}

export function createServerSupabaseClient(
  accessToken?: string
): SupabaseClient {
  if (isMissingConfig()) {
    return new Proxy({} as SupabaseClient, {
      get() {
        return () => ({ data: null, error: { message: "Supabase not configured" } });
      },
    });
  }

  const { url } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  // Use service role key on the server to bypass RLS
  if (serviceRoleKey) {
    return createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
      ...(accessToken
        ? {
            global: {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          }
        : {}),
    });
  }

  const { anonKey } = getSupabaseConfig();
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
