"use client";

import type { Route } from "next";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = (await response.json()) as { ok: boolean; error?: string };

    if (!response.ok || !data.ok) {
      setLoading(false);
      setError(data.error ?? "Unable to register.");
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password
    });

    setLoading(false);

    if (!result || result.error) {
      router.push("/login" as Route);
      return;
    }

    router.push("/predictions" as Route);
  };

  return (
    <div className="mx-auto max-w-md ufc-panel p-6">
      <h1 className="font-display text-3xl text-ufc-red">Create Account</h1>
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
          minLength={8}
          required
        />

        {error ? <p className="text-sm text-ufc-red">{error}</p> : null}

        <button className="ufc-button w-full" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="text-ufc-red hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
}