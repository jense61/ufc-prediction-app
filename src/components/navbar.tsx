"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data } = useSession();

  return (
    <nav className="border-b border-ufc-red/50 bg-black/50">
      <div className="mx-auto max-w-6xl px-2 py-3 sm:px-4 sm:py-4">
        <Link href="/" className="block text-center font-display text-lg leading-tight text-ufc-red sm:text-2xl">
          UFC Fight Prophet
        </Link>

        <div className="mt-3 grid grid-cols-4 border border-ufc-red/70 text-[10px] uppercase tracking-wide sm:text-sm">
          <Link href="/predictions" className="inline-flex w-full items-center justify-center border-r border-ufc-red/70 px-1 py-2 hover:bg-ufc-red/20 hover:text-ufc-red">
            Predictions
          </Link>
          <Link href="/leaderboard" className="inline-flex w-full items-center justify-center border-r border-ufc-red/70 px-1 py-2 hover:bg-ufc-red/20 hover:text-ufc-red">
            Leaderboard
          </Link>
          <Link href="/history" className="inline-flex w-full items-center justify-center border-r border-ufc-red/70 px-1 py-2 hover:bg-ufc-red/20 hover:text-ufc-red">
            History
          </Link>
          {data?.user ? (
            <button onClick={() => signOut({ callbackUrl: "/" })} className="inline-flex w-full items-center justify-center px-1 py-2 hover:bg-ufc-red/20 hover:text-ufc-red">
              LOGOUT
            </button>
          ) : (
            <Link href="/login" className="inline-flex w-full items-center justify-center px-1 py-2 hover:bg-ufc-red/20 hover:text-ufc-red">
              LOGIN
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}