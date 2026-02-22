"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data } = useSession();

  return (
    <nav className="border-b border-ufc-red/50 bg-black/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-xl text-ufc-red">
          UFC PREDICTIONS
        </Link>

        <div className="flex items-center gap-4 text-sm uppercase tracking-wide">
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
              className="border border-ufc-red px-3 py-1 hover:bg-ufc-red"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="border border-ufc-red px-3 py-1 hover:bg-ufc-red">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}