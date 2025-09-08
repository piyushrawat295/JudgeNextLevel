import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",             // Homepage
  "/sign-in(.*)",  // Sign-in page
  "/sign-up(.*)"   // Sign-up page
]);

export default clerkMiddleware(async(auth, req) => {
  const { userId } = await auth();

  // If the route is private and user is not signed in → block it
  if (!isPublicRoute(req) && !userId) {
    return new Response("Unauthorized", { status: 401 });
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"], // Protect all routes except static assets
};
