import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthenticatedUser(req);

  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const profile = await getUserProfile(auth.user.id, auth.serverSupabase);

  if (!profile.role.includes("ADMIN")) {
    return NextResponse.json(
      { error: "Only administrators can finalize auctions" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const { data, error } = await auth.serverSupabase.rpc("finalize_auction", {
    p_auction_id: id,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Finalize failed" },
      { status: 400 }
    );
  }

  return NextResponse.json(data);
}
