"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data } = useSession();

  return (
    <nav className="border-b border-ufc-red/50 bg-black/50">
      <div className="mx-auto max-w-6xl px-2 py-3 sm:px-4 sm:py-4">
        <div className="grid grid-cols-5 items-center gap-1 text-[10px] uppercase tracking-wide sm:text-sm">
          <Link href="/predictions" className="inline-flex w-full items-center justify-center px-1 py-1 hover:text-ufc-red">
            Predictions
          </Link>
          <Link href="/leaderboard" className="inline-flex w-full items-center justify-center px-1 py-1 hover:text-ufc-red">
            Leaderboard
          </Link>

          <Link href="/" className="text-center font-display text-[11px] normal-case leading-tight text-ufc-red sm:text-lg">
            UFC Fight Prophet
          </Link>

          <Link href="/history" className="inline-flex w-full items-center justify-center px-1 py-1 hover:text-ufc-red">
            History
          </Link>

          {data?.user ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex w-full items-center justify-center border border-ufc-red px-1 py-1 hover:bg-ufc-red"
            >
              LOGOUT
            </button>
          ) : (
            <Link href="/login" className="inline-flex w-full items-center justify-center border border-ufc-red px-1 py-1 hover:bg-ufc-red">
              LOGIN
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}