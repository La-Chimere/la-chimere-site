import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renomme middleware.ts -> proxy.ts (fonction `proxy` au lieu de
// `middleware`). Rafraîchit la session Supabase sur chaque requête et
// redirige les visiteurs non connectés vers /login (voir CDC 4.1).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
