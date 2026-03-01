import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "@/app/providers";
import { Countdown } from "@/components/countdown";
import { Navbar } from "@/components/navbar";
import { prisma } from "@/lib/prisma";
import "@/app/globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "UFC Fight Prophet",
  description: "Predict outcomes for numbered UFC events",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UFC Fight Prophet"
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const upcomingEvent = await prisma.event.findFirst({
    where: { isCompleted: false },
    orderBy: { date: "asc" }
  });

  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-8">{children}</main>
          {upcomingEvent ? (
            <div className="fixed bottom-4 right-4 hidden w-80 md:block">
              <Countdown targetDate={upcomingEvent.date.toISOString()} />
            </div>
          ) : null}
          <footer className="border-t border-ufc-red/30 px-4 py-6 text-center text-xs uppercase tracking-wider leading-relaxed text-zinc-400">
            UFC Fight Prophet • <Link href="/leaderboard">View Leaderboard</Link>
          </footer>
        </Providers>
      </body>
    </html>
  );
}