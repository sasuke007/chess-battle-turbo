import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get("isActive");

    const legends = await prisma.legend.findMany({
      where: isActive !== null ? { isActive: isActive === "true" } : undefined,
      orderBy: { createdAt: "desc" },
    });

    // Convert BigInt to string for JSON serialization
    const legendsWithStringIds = legends.map(legend => ({
      ...legend,
      id: legend.id.toString(),
    }));

    return NextResponse.json(
      {
        success: true,
        data: { legends: legendsWithStringIds },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching legends:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch legends",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
