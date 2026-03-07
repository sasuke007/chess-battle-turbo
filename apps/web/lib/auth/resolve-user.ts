import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type DbUser = Awaited<ReturnType<typeof prisma.user.findUnique>>;

/**
 * Resolve the authenticated DB user from a request.
 *
 * When PERF_AUTH_BYPASS is set, accepts `userReferenceId` from the request body
 * instead of going through Clerk. Uses request.clone() so the original body
 * can still be read by the route handler.
 */
export async function resolveUser(request: NextRequest): Promise<DbUser> {
  if (process.env.PERF_AUTH_BYPASS === "true") {
    const body = await request.clone().json();
    if (body.userReferenceId) {
      return prisma.user.findUnique({ where: { referenceId: body.userReferenceId } });
    }
    // No userReferenceId — fall through to Clerk auth
  }

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  return prisma.user.findUnique({ where: { email } });
}
