import { NextRequest, NextResponse } from "next/server";
import { cancelMatchRequest } from "@/lib/services/matchmaking";
import { logger } from "@/lib/logger";

/**
 * Beacon-compatible cancel endpoint
 * Accepts application/x-www-form-urlencoded for sendBeacon() compatibility
 * Returns minimal response and gracefully handles already-processed entries
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let queueReferenceId: string | null = null;
    let userReferenceId: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.text();
      const params = new URLSearchParams(formData);
      queueReferenceId = params.get("queueReferenceId");
      userReferenceId = params.get("userReferenceId");
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      queueReferenceId = body.queueReferenceId;
      userReferenceId = body.userReferenceId;
    } else {
      // Try to parse as form data anyway (sendBeacon default)
      const formData = await request.text();
      const params = new URLSearchParams(formData);
      queueReferenceId = params.get("queueReferenceId");
      userReferenceId = params.get("userReferenceId");
    }

    if (!queueReferenceId || !userReferenceId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    await cancelMatchRequest(queueReferenceId, userReferenceId);

    // Minimal response for beacon
    return NextResponse.json({ success: true });
  } catch (error) {
    // Log but don't fail - beacons are fire-and-forget
    logger.error("Beacon cancel error", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
