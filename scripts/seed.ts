import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, serviceKey);

async function seed() {
  // Create auction
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - 1);
  const endTime = new Date();
  endTime.setDate(endTime.getDate() + 7);

  const { data: auction, error: auctionErr } = await supabase
    .from("auctions")
    .upsert({
      title: "Spring 2026 Kogbucks Auction",
      description: "Bid on exclusive rewards using your Kogbucks balance!",
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "ACTIVE",
    })
    .select()
    .single();

  if (auctionErr) {
    console.error("Auction error:", auctionErr);
    return;
  }

  console.log("Created auction:", auction.id);

  // Create items
  const items = [
    {
      auction_id: auction.id,
      name: "Premium Headphones",
      description: "Sony WH-1000XM5 wireless noise-cancelling headphones. Top-tier audio quality.",
      image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
      starting_bid: 50,
      current_bid: 50,
      status: "ACTIVE",
    },
    {
      auction_id: auction.id,
      name: "Gift Card Bundle",
      description: "$100 Amazon gift card bundle. Perfect for any occasion.",
      image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600",
      starting_bid: 30,
      current_bid: 30,
      status: "ACTIVE",
    },
    {
      auction_id: auction.id,
      name: "Smart Watch",
      description: "Apple Watch SE with fitness tracking, heart rate monitor, and notifications.",
      image_url: "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600",
      starting_bid: 80,
      current_bid: 80,
      status: "ACTIVE",
    },
    {
      auction_id: auction.id,
      name: "Wireless Keyboard",
      description: "Logitech MX Keys mechanical keyboard. Backlit, ergonomic, multi-device.",
      image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
      starting_bid: 25,
      current_bid: 25,
      status: "ACTIVE",
    },
    {
      auction_id: auction.id,
      name: "Coffee Maker",
      description: "Nespresso Vertuo Next coffee machine. Barista-quality espresso at home.",
      image_url: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600",
      starting_bid: 40,
      current_bid: 40,
      status: "ACTIVE",
    },
    {
      auction_id: auction.id,
      name: "Portable Speaker",
      description: "JBL Flip 6 waterproof Bluetooth speaker. Bold sound anywhere you go.",
      image_url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600",
      starting_bid: 35,
      current_bid: 35,
      status: "ACTIVE",
    },
  ];

  const { error: itemsErr } = await supabase.from("items").insert(items);

  if (itemsErr) {
    console.error("Items error:", itemsErr);
    return;
  }

  console.log(`Created ${items.length} items`);
  console.log("Seed complete!");
}

seed();
