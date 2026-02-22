"use client";

import type { Route } from "next";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/predictions";
  const safeCallbackUrl = callbackUrl.startsWith("/") ? callbackUrl : "/predictions";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password
    });

    setLoading(false);

    if (!result || result.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(safeCallbackUrl as Route);
  };

  return (
    <div className="mx-auto max-w-md ufc-panel p-6">
      <h1 className="font-display text-3xl text-ufc-red">Login</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <input
          className="w-full rounded-none border border-zinc-700 bg-black px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="w-full rounded-none border border-zinc-700 bg-black px-3 py-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error ? <p className="text-sm text-ufc-red">{error}</p> : null}

        <button className="ufc-button w-full" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-400">
        No account yet?{" "}
        <Link href="/register" className="text-ufc-red hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
}