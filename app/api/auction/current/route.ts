import { NextResponse } from "next/server";
import { getCurrentAuctionWithItems, isAuctionActive } from "@/lib/auction";

export async function GET() {
  try {
    const { auction, items } = await getCurrentAuctionWithItems();

    if (!auction) {
      return NextResponse.json({ auction: null, items: [] });
    }

    return NextResponse.json({
      auction: {
        ...auction,
        is_live: isAuctionActive(auction),
      },
      items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch auction",
      },
      { status: 500 }
    );
  }
}
