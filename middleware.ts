import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export async function middleware(request: NextRequest) {
    const response = handleI18nRouting(request);

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Helper to check if path is public
    const isPublic = (path: string) => {
        // Remove locale prefix if present
        const pathWithoutLocale = path.replace(/^\/(en|pl)/, "") || "/";

        // Exact match or starts with for sub-routes
        const publicPaths = [
            "/login",
            "/register",
            "/reset-password",
            "/update-password",
            "/",
            "/auth/callback" // Important for auth flow
        ];

        if (publicPaths.includes(pathWithoutLocale)) return true;

        return publicPaths.some(p => p !== "/" && pathWithoutLocale.startsWith(p + "/"));
    };

    if (!user && !isPublic(pathname)) {
        // Redirect to login, preserving locale
        const locale = request.nextUrl.pathname.match(/^\/(en|pl)/)?.[1] || "en";
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/login`;
        return NextResponse.redirect(url);
    }

    return response;
}

export const config = {
    matcher: [
        "/",
        "/(pl|en)/:path*",
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
    ],
};
