"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

interface AuctionDraft {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

const emptyDraft: AuctionDraft = {
  title: "",
  description: "",
  start_time: "",
  end_time: "",
};

export default function CreateAuctionPage() {
  const supabase = getSupabaseBrowserClient();
  const [draft, setDraft] = useState<AuctionDraft>(emptyDraft);
  const [status, setStatus] = useState("Checking permissions...");
  const [isAdmin, setIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const checkAdmin = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setStatus("Sign in to access this page.");
      return;
    }

    const res = await fetch("/api/profile", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      setStatus("Unable to verify permissions.");
      return;
    }

    const profile = await res.json();
    if (profile.role?.toUpperCase().includes("ADMIN")) {
      setIsAdmin(true);
      setStatus("");
    } else {
      setStatus("Only administrators can create auctions.");
    }
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkAdmin();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [checkAdmin]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("Creating auction...");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setStatus("Session expired. Please sign in again.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/auctions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        title: draft.title,
        description: draft.description,
        start_time: new Date(draft.start_time).toISOString(),
        end_time: new Date(draft.end_time).toISOString(),
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setStatus(data.error ?? "Failed to create auction.");
      return;
    }

    setStatus("Auction created!");
    setDraft(emptyDraft);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,_#fff3c1,_#f0eadf_42%,_#dfe7df)] px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
              Admin
            </p>
            <h1 className="mt-2 font-serif text-4xl">Create Auction</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auction" className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-700">
              Auctions
            </Link>
            <Link href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-700">
              Home
            </Link>
          </div>
        </div>

        {status ? (
          <p className="mt-6 text-sm uppercase tracking-[0.25em] text-stone-500">{status}</p>
        ) : null}

        {isAdmin ? (
          <section className="mt-8 rounded-[2rem] border border-stone-900/10 bg-white/90 p-8 shadow-[0_20px_60px_rgba(120,98,47,0.12)]">
            <h2 className="font-serif text-3xl">New Auction</h2>
            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-stone-700">
                Title
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="e.g. Spring 2026 Kogbucks Auction"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-stone-700">
                Description
                <textarea
                  className="mt-2 min-h-28 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Optional description for the auction"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-stone-700">
                  Start Time
                  <input
                    className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                    type="datetime-local"
                    value={draft.start_time}
                    onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
                    required
                  />
                </label>

                <label className="block text-sm font-medium text-stone-700">
                  End Time
                  <input
                    className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                    type="datetime-local"
                    value={draft.end_time}
                    onChange={(e) => setDraft({ ...draft, end_time: e.target.value })}
                    required
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="justify-self-start rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-50 disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Create Auction"}
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </main>
  );
}
