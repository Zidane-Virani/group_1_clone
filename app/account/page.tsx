"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

interface SessionProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  kogbucks_balance: number;
}

export default function AccountPage() {
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [status, setStatus] = useState("Checking session...");
  const [submitting, setSubmitting] = useState(false);

  const loadProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setProfile(null);
      setStatus("Sign in to view your account.");
      return;
    }

    const res = await fetch("/api/profile", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setProfile(null);
      setStatus(data.error ?? "Unable to load your account.");
      return;
    }

    setProfile(data);
    setStatus("Signed in");
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });

    return () => {
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("Signing in...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus(error.message);
      setSubmitting(false);
      return;
    }

    setPassword("");
    setSubmitting(false);
    await loadProfile();
  }

  async function handleLogout() {
    setSubmitting(true);
    await supabase.auth.signOut();
    setSubmitting(false);
    setProfile(null);
    setStatus("Signed out");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,_#fff3c1,_#f0eadf_42%,_#dfe7df)] px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
              My Account
            </p>
            <h1 className="mt-2 font-serif text-4xl">Account</h1>
          </div>
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-700">
            Home
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-stone-900/10 bg-white/85 p-8 shadow-[0_20px_60px_rgba(120,98,47,0.12)]">
            <h2 className="font-serif text-3xl">Sign In</h2>

            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <label className="block text-sm font-medium text-stone-700">
                Email
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label className="block text-sm font-medium text-stone-700">
                Password
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-50 disabled:opacity-60"
              >
                {submitting ? "Working..." : "Sign In"}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-stone-900/10 bg-stone-900 p-8 text-stone-50 shadow-[0_20px_60px_rgba(32,26,14,0.25)]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-3xl">Profile</h2>
              <p className="text-xs uppercase tracking-[0.25em] text-stone-400">{status}</p>
            </div>

            {profile ? (
              <div className="mt-8 space-y-5 text-lg">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Name</p>
                  <p className="mt-1">{profile.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Email</p>
                  <p className="mt-1">{profile.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Role</p>
                  <p className="mt-1">{profile.role}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Balance</p>
                  <p className="mt-1 text-3xl font-semibold">{profile.kogbucks_balance} KB</p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={submitting}
                  className="rounded-full border border-stone-100/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-50 disabled:opacity-60"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mt-8 text-stone-300">
                <p>No active session.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
