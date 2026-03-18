import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile";
import { normalizeAuction } from "@/lib/auction";

export async function POST(req: Request) {
  const auth = await getAuthenticatedUser(req);

  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const profile = await getUserProfile(auth.user.id, auth.serverSupabase, auth.user.email ?? "");

  if (!profile.role.includes("ADMIN")) {
    return NextResponse.json(
      { error: "Only administrators can create auctions" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const start_time = String(body.start_time ?? "").trim();
  const end_time = String(body.end_time ?? "").trim();

  if (!title || !start_time || !end_time) {
    return NextResponse.json(
      { error: "title, start_time, and end_time are required" },
      { status: 400 }
    );
  }

  const { data, error } = await auth.serverSupabase
    .from("auctions")
    .insert({
      title,
      description: description || null,
      start_time,
      end_time,
      status: "ACTIVE",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create auction" },
      { status: 500 }
    );
  }

  return NextResponse.json(normalizeAuction(data as Record<string, unknown>), { status: 201 });
}
