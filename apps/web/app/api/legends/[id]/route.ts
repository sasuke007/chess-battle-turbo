import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

const updateLegendSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  era: z.string().min(1, "Era is required").optional(),
  profilePhotoUrl: z.string().url("Must be a valid URL").optional().nullable(),
  peakRating: z.number().int().positive().optional().nullable(),
  nationality: z.string().optional().nullable(),
  shortDescription: z.string().min(1, "Short description is required").max(500).optional(),
  playingStyle: z.string().optional().nullable(),
  birthYear: z.number().int().min(1000).max(9999).optional().nullable(),
  deathYear: z.number().int().min(1000).max(9999).optional().nullable(),
  achievements: z.array(z.string()).optional().nullable(),
  famousGames: z.array(z.object({
    fen: z.string(),
    description: z.string().optional(),
  })).optional().nullable(),
  isActive: z.boolean().optional(),
});

type UpdateLegendRequest = z.infer<typeof updateLegendSchema>;

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const legendId = BigInt(params.id);
    const body = await request.json();
    const validatedData = updateLegendSchema.parse(body);

    // Check if legend exists
    const existingLegend = await prisma.legend.findUnique({
      where: { id: legendId }
    });

    if (!existingLegend) {
      return NextResponse.json(
        { error: "Legend not found" },
        { status: 404 }
      );
    }

    // If name is being changed, check for duplicates
    if (validatedData.name && validatedData.name !== existingLegend.name) {
      const duplicateName = await prisma.legend.findFirst({
        where: {
          name: validatedData.name,
          id: { not: legendId }
        }
      });

      if (duplicateName) {
        return NextResponse.json(
          { error: "A legend with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Prepare update data with proper JSON handling
    const updateData: any = { ...validatedData };
    if ('achievements' in updateData) {
      updateData.achievements = updateData.achievements ? updateData.achievements : Prisma.JsonNull;
    }
    if ('famousGames' in updateData) {
      updateData.famousGames = updateData.famousGames ? updateData.famousGames : Prisma.JsonNull;
    }

    // Update the legend
    const legend = await prisma.legend.update({
      where: { id: legendId },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Legend updated successfully",
        data: {
          legend: {
            id: legend.id.toString(),
            referenceId: legend.referenceId,
            name: legend.name,
            era: legend.era,
            updatedAt: legend.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Error updating legend:", error);
    return NextResponse.json(
      {
        error: "Failed to update legend",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET single legend by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const legendId = BigInt(params.id);

    const legend = await prisma.legend.findUnique({
      where: { id: legendId }
    });

    if (!legend) {
      return NextResponse.json(
        { error: "Legend not found" },
        { status: 404 }
      );
    }

    // Convert BigInt to string for JSON serialization
    const legendWithStringId = {
      ...legend,
      id: legend.id.toString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: { legend: legendWithStringId },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching legend:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch legend",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
