export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/predictions/:path*", "/leaderboard/:path*", "/history/:path*"]
};