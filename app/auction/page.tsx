/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

interface AuctionItem {
  id: string;
  auction_id: string;
  name: string;
  description: string;
  image_url: string | null;
  starting_bid: number;
  current_bid: number;
  current_bidder_id: string | null;
  winner_id: string | null;
  status: string;
}

interface AuctionPayload {
  auction: {
    id: string;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    status: string;
    is_live: boolean;
  } | null;
  items: AuctionItem[];
  error?: string;
}

interface ProfilePayload {
  id: string;
  role: string;
  kogbucks_balance: number;
}

export default function AuctionPage() {
  const supabase = getSupabaseBrowserClient();
  const [data, setData] = useState<AuctionPayload>({ auction: null, items: [] });
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [nowTs, setNowTs] = useState<number | null>(null);

  const loadAuction = useCallback(async () => {
    const response = await fetch("/api/auction/current");
    const payload = (await response.json()) as AuctionPayload;

    setData({
      auction: payload.auction,
      items: payload.items ?? [],
      error: payload.error,
    });
  }, []);

  const loadProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setProfile(null);
      return;
    }

    const response = await fetch("/api/profile", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      setProfile(null);
      return;
    }

    const payload = (await response.json()) as ProfilePayload;
    setProfile(payload);
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAuction();
      void loadProfile();
      setNowTs(Date.now());
    }, 0);

    const intervalId = window.setInterval(() => {
      setNowTs(Date.now());
    }, 30000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      subscription.unsubscribe();
    };
  }, [loadAuction, loadProfile, supabase]);

  async function placeBid(itemId: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token || !data.auction) {
      return;
    }

    setBusyItemId(itemId);
    const response = await fetch("/api/bids", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        auction_id: data.auction.id,
        item_id: itemId,
      }),
    });

    await response.json();
    setBusyItemId(null);

    await loadAuction();
    await loadProfile();
  }

  async function finalizeAuction() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token || !data.auction) {
      return;
    }

    setFinalizing(true);
    await fetch(`/api/auctions/${data.auction.id}/finalize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    setFinalizing(false);
    await loadAuction();
    await loadProfile();
  }

  const auctionStartTime = data.auction
    ? new Date(data.auction.start_time).getTime()
    : null;
  const auctionEndTime = data.auction
    ? new Date(data.auction.end_time).getTime()
    : null;
  const initialBidCutoff = auctionStartTime
    ? auctionStartTime + 30 * 60 * 1000
    : null;
  const initialBidWindowOpen = initialBidCutoff && nowTs
    ? nowTs <= initialBidCutoff
    : false;
  const closingSoon = auctionEndTime && nowTs
    ? auctionEndTime - nowTs <= 10 * 60 * 1000 && auctionEndTime - nowTs > 0
    : false;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#e8f2e2,_#f6f1df_45%,_#fff7eb)] px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
              Auctions
            </p>
            <h1 className="mt-2 font-serif text-4xl">Live Auction</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/account" className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-700">
              Account
            </Link>
            <Link href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-700">
              Home
            </Link>
          </div>
        </div>

        <section className="mt-8 rounded-[2rem] border border-stone-900/10 bg-white/85 p-8 shadow-[0_20px_60px_rgba(88,102,54,0.14)]">
          {data.auction ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-stone-500">
                    {data.auction.is_live ? "Live" : data.auction.status}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl">{data.auction.title}</h2>
                  {data.auction.description ? (
                    <p className="mt-3 max-w-2xl text-stone-600">
                      {data.auction.description}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-[1.5rem] bg-stone-900 px-5 py-4 text-stone-50">
                  <p className="text-xs uppercase tracking-[0.25em] text-stone-300">Ends</p>
                  <p className="mt-2 text-sm">{new Date(data.auction.end_time).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                {profile ? (
                  <p className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-900">
                    {profile.kogbucks_balance} KB
                  </p>
                ) : (
                  <p className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
                    Sign in to bid
                  </p>
                )}
                {closingSoon ? (
                  <p className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-900">
                    Closing soon
                  </p>
                ) : null}
                {profile?.role.includes("ADMIN") ? (
                  <>
                    <Link
                      href="/auctions/create"
                      className="rounded-full border border-stone-900/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-stone-900"
                    >
                      Create Auction
                    </Link>
                    <button
                      type="button"
                      onClick={finalizeAuction}
                      disabled={finalizing}
                      className="rounded-full border border-stone-900/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-stone-900 disabled:opacity-60"
                    >
                      {finalizing ? "Closing..." : "Close auction"}
                    </button>
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-stone-600">No auction available.</p>
          )}
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((item) => {
            const isHighestBidder = profile?.id === item.current_bidder_id;
            const isWinner = profile?.id === item.winner_id;
            const firstBidLocked = !item.current_bidder_id && !initialBidWindowOpen;
            const canBid = Boolean(
              data.auction?.is_live &&
                profile &&
                profile.kogbucks_balance > item.current_bid &&
                !isHighestBidder &&
                !firstBidLocked &&
                !item.winner_id
            );

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-[2rem] border border-stone-900/10 bg-white/90 shadow-[0_18px_50px_rgba(88,102,54,0.12)]"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-stone-200 text-sm uppercase tracking-[0.25em] text-stone-500">
                    No image
                  </div>
                )}

                <div className="p-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
                    Current bid
                  </p>
                  <p className="mt-1 text-2xl font-semibold">{item.current_bid} KB</p>
                  <h3 className="mt-4 font-serif text-2xl">{item.name}</h3>
                  <p className="mt-3 min-h-20 text-sm leading-6 text-stone-600">
                    {item.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {isHighestBidder ? (
                      <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-900">
                        Leading
                      </p>
                    ) : null}
                    {isWinner ? (
                      <p className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-green-900">
                        Won
                      </p>
                    ) : null}
                    {!isWinner && item.winner_id ? (
                      <p className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700">
                        Sold
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Start</p>
                      <p className="mt-1 text-lg font-semibold">{item.starting_bid} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => placeBid(item.id)}
                      disabled={!canBid || busyItemId === item.id}
                      className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-50 disabled:cursor-not-allowed disabled:bg-stone-400"
                    >
                      {busyItemId === item.id
                        ? "Bidding..."
                        : isWinner
                          ? "Won"
                          : isHighestBidder
                            ? "Leading"
                            : firstBidLocked
                              ? "Closed"
                              : item.winner_id
                                ? "Sold"
                                : "Bid"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
