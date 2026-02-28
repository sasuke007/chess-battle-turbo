import { NextResponse } from "next/server";
import { getSessionUser } from "./get-session-user";

export async function requireAdmin() {
  const user = await getSessionUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  }

  if (user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), user: null };
  }

  return { error: null, user };
}
