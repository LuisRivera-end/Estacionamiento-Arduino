import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              // Next.js only allows cookie writes inside a Server Action or Route Handler.
              cookieStore.set(name, value, options);
            } catch {
              // Ignore writes during Server Component rendering and rely on dedicated
              // mutation entrypoints to persist refreshed auth cookies.
            }
          });
        },
      },
    },
  );
}

export async function getServerAccessToken() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL === "fixture") {
    return "fixture-token";
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}
