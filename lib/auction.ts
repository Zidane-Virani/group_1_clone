import { createServerSupabaseClient } from "@/lib/supabaseClient";

export type AuctionSummary = {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: string;
};

export type AuctionItemSummary = {
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
};

export function normalizeAuction(row: Record<string, unknown>): AuctionSummary {
  return {
    id: String(row.id),
    title: String(row.title ?? row.name ?? "Untitled auction"),
    description:
      typeof row.description === "string" ? row.description : null,
    start_time: String(row.start_time),
    end_time: String(row.end_time),
    status: String(row.status ?? "ACTIVE"),
  };
}

export function normalizeItem(
  row: Record<string, unknown>
): AuctionItemSummary {
  return {
    id: String(row.id),
    auction_id: String(row.auction_id),
    name: String(row.name ?? row.title ?? "Untitled item"),
    description: String(row.description ?? ""),
    image_url: typeof row.image_url === "string" ? row.image_url : null,
    starting_bid: Number(row.starting_bid ?? row.starting_price ?? 0),
    current_bid: Number(
      row.current_bid ?? row.starting_bid ?? row.starting_price ?? 0
    ),
    current_bidder_id:
      typeof row.current_bidder_id === "string" ? row.current_bidder_id : null,
    winner_id: typeof row.winner_id === "string" ? row.winner_id : null,
    status: String(row.status ?? "ACTIVE"),
  };
}

export function isAuctionActive(auction: AuctionSummary) {
  const now = Date.now();
  const start = new Date(auction.start_time).getTime();
  const end = new Date(auction.end_time).getTime();
  const status = auction.status.toLowerCase();

  return status === "active" && start <= now && now <= end;
}

export async function getCurrentAuctionWithItems() {
  const serverSupabase = createServerSupabaseClient();

  const { data: auctionRows, error: auctionError } = await serverSupabase
    .from("auctions")
    .select("*")
    .order("start_time", { ascending: false })
    .limit(10);

  if (auctionError) {
    throw new Error(auctionError.message);
  }

  const auctions = (auctionRows ?? []).map((row) =>
    normalizeAuction(row as Record<string, unknown>)
  );

  const currentAuction =
    auctions.find((auction) => isAuctionActive(auction)) ?? auctions[0] ?? null;

  if (!currentAuction) {
    return { auction: null, items: [] as AuctionItemSummary[] };
  }

  const { data: itemRows, error: itemError } = await serverSupabase
    .from("items")
    .select("*")
    .eq("auction_id", currentAuction.id)
    .order("created_at", { ascending: true });

  if (itemError) {
    throw new Error(itemError.message);
  }

  return {
    auction: currentAuction,
    items: (itemRows ?? []).map((row) =>
      normalizeItem(row as Record<string, unknown>)
    ),
  };
}
