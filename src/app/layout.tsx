import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "@/app/providers";
import { Countdown } from "@/components/countdown";
import { Navbar } from "@/components/navbar";
import { prisma } from "@/lib/prisma";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "UFC Prediction App",
  description: "Predict outcomes for numbered UFC events",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UFC Predictions"
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
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          {upcomingEvent ? (
            <div className="fixed bottom-4 right-4 hidden w-80 md:block">
              <Countdown targetDate={upcomingEvent.date.toISOString()} />
            </div>
          ) : null}
          <footer className="border-t border-ufc-red/30 py-6 text-center text-xs uppercase tracking-wider text-zinc-400">
            Built for numbered UFC event predictions • <Link href="/leaderboard">View Leaderboard</Link>
          </footer>
        </Providers>
      </body>
    </html>
  );
}