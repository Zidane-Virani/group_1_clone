import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { deleteItem } from "@/lib/items";
import { normalizeItem } from "@/lib/auction";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const updatePayload = {
    name: String(body.name ?? "").trim(),
    description: String(body.description ?? "").trim(),
    image_url: String(body.image_url ?? "").trim(),
    auction_id: String(body.auction_id ?? "").trim(),
    starting_bid: Number(body.starting_bid ?? body.starting_price ?? 0),
    status: String(body.status ?? "ACTIVE"),
  };

  if (
    !updatePayload.name ||
    !updatePayload.description ||
    !updatePayload.image_url ||
    !updatePayload.auction_id
  ) {
    return NextResponse.json(
      { error: "name, description, image_url, and auction_id are required" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(updatePayload.starting_bid) || updatePayload.starting_bid < 0) {
    return NextResponse.json(
      { error: "starting_bid must be a non-negative number" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("items")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message || "Update failed" },
      { status: 500 }
    );
  }

  return NextResponse.json(normalizeItem(data as Record<string, unknown>));
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deleteItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
