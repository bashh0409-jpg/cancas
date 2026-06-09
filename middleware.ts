import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function middleware(request: NextRequest) {
  // Clone the request headers for the Supabase client
  const cookieStore = await cookies();
  const requestUrl = new URL(request.url);

  // Only validate protected routes
  const protectedPaths = ["/home", "/canvas"];
  const isProtectedRoute = protectedPaths.some((path) =>
    requestUrl.pathname.startsWith(path)
  );

  if (!isProtectedRoute) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  // Create a Supabase client with the cookies from the request
  const supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              maxAge: options?.maxAge ?? 60 * 60 * 24 * 365,
              sameSite: options?.sameSite ?? "lax",
              secure: process.env.NODE_ENV === "production",
              path: options?.path ?? "/",
            })
          );
        },
      },
    }
  );

  // Get the current session
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  // If no session, redirect to signin
  if (!session) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Verify the user's account still exists by trying to fetch their canvases
  // If the account was deleted, the RLS policy will prevent access
  const { data: userCanvases, error } = await supabaseClient
    .from("canvases")
    .select("id")
    .limit(1);

  // If there's an error (likely due to deleted account or auth issues), clear session and redirect
  if (error) {
    // Sign out the user
    await supabaseClient.auth.signOut();

    // Redirect to signin
    const response = NextResponse.redirect(new URL("/signin", request.url));

    // Clear auth cookies
    const cookieStore = await cookies();
    cookieStore.delete("sb-access-token");
    cookieStore.delete("sb-refresh-token");

    return response;
  }

  // Session is valid, continue
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export const config = {
  matcher: ["/home/:path*", "/canvas/:path*"],
};
