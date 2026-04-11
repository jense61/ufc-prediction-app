"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data } = useSession();

  return (
    <nav className="border-b border-ufc-red/50 bg-black/50">
      <div className="mx-auto max-w-6xl px-2 py-3 sm:px-4 sm:py-4">
        <Link href="/" className="flex justify-center">
          <span className="font-display text-3xl uppercase text-ufc-red sm:text-4xl">UFC Fight Prophet</span>
        </Link>

        <div className="mt-3 grid grid-cols-3 border border-ufc-red/70 text-[10px] uppercase tracking-wide sm:text-sm">
          <Link href="/leaderboard" className="inline-flex w-full items-center justify-center border-r border-ufc-red/70 px-1 py-2 hover:bg-ufc-red/20 hover:text-ufc-red">
            Leaderboard
          </Link>
          <Link href="/predictions" className="inline-flex w-full items-center justify-center border-r border-ufc-red/70 px-1 py-2 hover:bg-ufc-red/20 hover:text-ufc-red">
            Predictions
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