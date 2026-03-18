import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserProfile, UserProfile } from "@/lib/profile";

interface ProfileResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  kogbucks_balance: number;
}

export async function GET(req: Request): Promise<NextResponse> {
  const auth = await getAuthenticatedUser(req);

  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const profile: UserProfile = await getUserProfile(
      auth.user.id,
      auth.serverSupabase
    );

    const response: ProfileResponse = {
      id: auth.user.id,
      email: auth.user.email ?? "",
      name: profile.name,
      role: profile.role,
      kogbucks_balance: profile.kogbucks_balance,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
