import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get("isActive");
    const isVisible = searchParams.get("isVisible");

    // Build where clause based on query params
    const whereClause: { isActive?: boolean; isVisible?: boolean } = {};
    if (isActive !== null) {
      whereClause.isActive = isActive === "true";
    }
    if (isVisible !== null) {
      whereClause.isVisible = isVisible === "true";
    }

    const legends = await prisma.legend.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: { name: "asc" },
      select: {
        id: true,
        referenceId: true,
        name: true,
        era: true,
        profilePhotoUrl: true,
        peakRating: true,
        nationality: true,
        shortDescription: true,
        playingStyle: true,
        isActive: true,
        isVisible: true,
      },
    });

    // Convert BigInt to string and format for frontend
    const legendsFormatted = legends.map(legend => ({
      id: legend.referenceId, // Use referenceId as the ID for frontend
visibleId: legend.id.toString(),
      name: legend.name,
      era: legend.era,
      profilePhotoUrl: legend.profilePhotoUrl,
      peakRating: legend.peakRating,
      nationality: legend.nationality,
      description: legend.shortDescription,
      playingStyle: legend.playingStyle,
      isActive: legend.isActive,
      isVisible: legend.isVisible,
    }));

    return NextResponse.json(
      {
        success: true,
        data: { legends: legendsFormatted },
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
