import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { normalizeItem } from "@/lib/auction";

export async function GET() {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch items" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    (data ?? []).map((item) => normalizeItem(item as Record<string, unknown>))
  );
}

export async function POST(req: Request) {
  const body = await req.json();

  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const image_url = String(body.image_url ?? "").trim();
  const auction_id = String(body.auction_id ?? "").trim();
  const starting_bid = Number(body.starting_bid ?? body.starting_price ?? 0);

  if (!name || !description || !image_url || !auction_id) {
    return NextResponse.json(
      { error: "name, description, image_url, and auction_id are required" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(starting_bid) || starting_bid < 0) {
    return NextResponse.json(
      { error: "starting_bid must be a non-negative number" },
      { status: 400 }
    );
  }

  const insertPayload = {
    name,
    description,
    image_url,
    auction_id,
    starting_bid,
    current_bid: starting_bid,
    status: String(body.status ?? "ACTIVE"),
  };

  const { data, error } = await supabase
    .from("items")
    .insert(insertPayload)
    .select("*");

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json(
      { error: error.message || "Create failed" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    (data ?? []).map((item) => normalizeItem(item as Record<string, unknown>)),
    { status: 201 }
  );
}
