import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const openings = await prisma.opening.findMany({
      where: { isActive: true },
      select: {
        referenceId: true,
        eco: true,
        name: true,
      },
      orderBy: [{ eco: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: {
        openings: openings.map((o) => ({
          id: o.referenceId,
          eco: o.eco,
          name: o.name,
        })),
      },
    });
  } catch (error) {
    logger.error("Error fetching openings", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch openings" },
      { status: 500 }
    );
  }
}
