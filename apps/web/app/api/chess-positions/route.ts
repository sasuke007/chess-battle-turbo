import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const featured = searchParams.get("featured");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause
    const where: {
      isActive?: boolean;
      featured?: boolean;
    } = {};

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (featured !== null) {
      where.featured = featured === "true";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch positions with related legends
    const [positions, total] = await Promise.all([
      prisma.chessPosition.findMany({
        where,
        include: {
          whiteLegend: {
            select: {
              id: true,
              referenceId: true,
              name: true,
              era: true,
              profilePhotoUrl: true,
            },
          },
          blackLegend: {
            select: {
              id: true,
              referenceId: true,
              name: true,
              era: true,
              profilePhotoUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.chessPosition.count({ where }),
    ]);

    // Convert BigInt IDs to strings for JSON serialization
    const positionsWithStringIds = positions.map((position) => ({
      ...position,
      id: position.id.toString(),
      whitePlayerId: position.whitePlayerId?.toString() || null,
      blackPlayerId: position.blackPlayerId?.toString() || null,
      whiteLegend: position.whiteLegend
        ? {
            ...position.whiteLegend,
            id: position.whiteLegend.id.toString(),
          }
        : null,
      blackLegend: position.blackLegend
        ? {
            ...position.blackLegend,
            id: position.blackLegend.id.toString(),
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        positions: positionsWithStringIds,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching chess positions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch chess positions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
