"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data } = useSession();

  return (
    <nav className="border-b border-ufc-red/50 bg-black/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
        <Link href="/" className="font-display text-lg leading-tight text-ufc-red sm:text-xl">
          UFC PREDICTIONS
        </Link>

        <div className="flex w-full flex-wrap items-center justify-start gap-2 text-xs uppercase tracking-wide sm:w-auto sm:justify-end sm:gap-4 sm:text-sm">
          <Link href="/predictions" className="hover:text-ufc-red">
            Predictions
          </Link>
          <Link href="/leaderboard" className="hover:text-ufc-red">
            Leaderboard
          </Link>
          <Link href="/history" className="hover:text-ufc-red">
            History
          </Link>

          {data?.user ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="border border-ufc-red px-2 py-1 text-xs hover:bg-ufc-red sm:px-3 sm:text-sm"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="border border-ufc-red px-2 py-1 text-xs hover:bg-ufc-red sm:px-3 sm:text-sm">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}