/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Item {
  id: string;
  auction_id: string;
  name: string;
  description: string;
  image_url: string | null;
  starting_bid: number;
  current_bid: number;
  status: string;
}

interface ItemDraft {
  name: string;
  description: string;
  image_url: string;
  auction_id: string;
  starting_bid: number;
  status: string;
}

const emptyDraft: ItemDraft = {
  name: "",
  description: "",
  image_url: "",
  auction_id: "",
  starting_bid: 0,
  status: "ACTIVE",
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [status, setStatus] = useState("Loading...");

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/items");
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
        setStatus("");
      } else {
        setItems([]);
        setStatus(data.error ?? "Failed to load items.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setItems([]);
      setStatus("Failed to load items.");
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchItems();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchItems]);

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error ?? "Create failed.");
      return;
    }

    setDraft(emptyDraft);
    setStatus("Saved");
    await fetchItems();
  }

  async function deleteItem(id: string) {
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    const data = await res.json();
    setStatus(res.ok ? "Deleted" : data.error ?? "Delete failed.");
    await fetchItems();
  }

  async function saveItem() {
    if (!editing) return;

    const res = await fetch(`/api/items/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error ?? "Update failed.");
      return;
    }

    setEditing(null);
    setStatus("Updated");
    await fetchItems();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#eef2f7,_#f6efe1_48%,_#fff7ea)] p-8 text-stone-900">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">Items</p>
            <h1 className="mt-2 font-serif text-4xl">Listings</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auction" className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-700">
              Auction
            </Link>
            <Link href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-700">
              Home
            </Link>
          </div>
        </div>

        {status ? (
          <p className="mt-6 text-sm uppercase tracking-[0.25em] text-stone-500">{status}</p>
        ) : null}

        <section className="mt-8 rounded-[2rem] border border-stone-900/10 bg-white/90 p-8 shadow-[0_20px_60px_rgba(120,98,47,0.12)]">
          <h2 className="font-serif text-3xl">New Item</h2>
          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={createItem}>
            <input
              className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3"
              placeholder="Name"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              required
            />
            <input
              className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3"
              placeholder="Auction ID"
              value={draft.auction_id}
              onChange={(event) => setDraft({ ...draft, auction_id: event.target.value })}
              required
            />
            <input
              className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 md:col-span-2"
              placeholder="Image URL"
              value={draft.image_url}
              onChange={(event) => setDraft({ ...draft, image_url: event.target.value })}
              required
            />
            <textarea
              className="min-h-32 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 md:col-span-2"
              placeholder="Description"
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              required
            />
            <input
              className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3"
              type="number"
              min={0}
              placeholder="Starting bid"
              value={draft.starting_bid}
              onChange={(event) =>
                setDraft({ ...draft, starting_bid: Number(event.target.value) })
              }
              required
            />
            <input
              className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3"
              placeholder="Status"
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value })}
              required
            />
            <button
              type="submit"
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-50 md:col-span-2 md:justify-self-start"
            >
              Save Item
            </button>
          </form>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-[2rem] border border-stone-900/10 bg-white/90 shadow-[0_18px_50px_rgba(120,98,47,0.10)]"
            >
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="h-52 w-full object-cover" />
              ) : (
                <div className="flex h-52 items-center justify-center bg-stone-200 text-sm uppercase tracking-[0.25em] text-stone-500">
                  No image
                </div>
              )}
              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-stone-500">{item.status}</p>
                <h3 className="mt-2 font-serif text-2xl">{item.name}</h3>
                <p className="mt-3 text-sm leading-6 text-stone-600">{item.description}</p>
                <div className="mt-5 grid grid-cols-2 gap-4 text-sm text-stone-700">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Current</p>
                    <p className="mt-1 font-semibold">{item.current_bid} KB</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Auction</p>
                    <p className="mt-1 font-semibold">{item.auction_id}</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="rounded-full border border-stone-900/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-stone-900"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {editing ? (
          <section className="mt-8 rounded-[2rem] border border-stone-900/10 bg-white/90 p-8 shadow-[0_20px_60px_rgba(120,98,47,0.12)]">
            <h2 className="font-serif text-3xl">Edit Item</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3"
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
              />
              <input
                className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3"
                value={editing.auction_id}
                onChange={(event) => setEditing({ ...editing, auction_id: event.target.value })}
              />
              <input
                className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 md:col-span-2"
                value={editing.image_url ?? ""}
                onChange={(event) =>
                  setEditing({ ...editing, image_url: event.target.value })
                }
              />
              <textarea
                className="min-h-32 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 md:col-span-2"
                value={editing.description}
                onChange={(event) =>
                  setEditing({ ...editing, description: event.target.value })
                }
              />
              <input
                className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3"
                type="number"
                min={0}
                value={editing.starting_bid}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    starting_bid: Number(event.target.value),
                  })
                }
              />
              <input
                className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3"
                value={editing.status}
                onChange={(event) => setEditing({ ...editing, status: event.target.value })}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={saveItem}
                className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-full border border-stone-900/15 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-900"
              >
                Cancel
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
