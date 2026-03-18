import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await getAuthenticatedUser(req);

  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const auctionId = String(body.auction_id ?? "").trim();
  const itemId = String(body.item_id ?? "").trim();

  if (!auctionId || !itemId) {
    return NextResponse.json(
      { error: "auction_id and item_id are required" },
      { status: 400 }
    );
  }

  const { data, error } = await auth.serverSupabase.rpc("place_full_balance_bid", {
    p_auction_id: auctionId,
    p_item_id: itemId,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Bid failed" },
      { status: 400 }
    );
  }

  return NextResponse.json(data);
}
