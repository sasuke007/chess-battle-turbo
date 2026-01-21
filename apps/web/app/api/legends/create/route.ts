import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

const createLegendSchema = z.object({
  name: z.string().min(1, "Name is required"),
  era: z.string().min(1, "Era is required"),
  profilePhotoUrl: z.string().url("Must be a valid URL").optional().nullable(),
  peakRating: z.number().int().positive().optional().nullable(),
  nationality: z.string().optional().nullable(),
  shortDescription: z.string().min(1, "Short description is required").max(500),
  playingStyle: z.string().optional().nullable(),
  birthYear: z.number().int().min(1000).max(9999).optional().nullable(),
  deathYear: z.number().int().min(1000).max(9999).optional().nullable(),
  achievements: z.array(z.string()).optional().nullable(),
  famousGames: z.array(z.object({
    fen: z.string(),
    description: z.string().optional(),
  })).optional().nullable(),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received legend data:", body);
    const validatedData = createLegendSchema.parse(body);
    console.log("Validated data:", validatedData);

    // Check if legend with same name already exists
    const existingLegend = await prisma.legend.findFirst({
      where: { name: validatedData.name }
    });

    if (existingLegend) {
      return NextResponse.json(
        { error: "A legend with this name already exists" },
        { status: 400 }
      );
    }

    // Create the legend
    const legend = await prisma.legend.create({
      data: {
        name: validatedData.name,
        era: validatedData.era,
        profilePhotoUrl: validatedData.profilePhotoUrl || null,
        peakRating: validatedData.peakRating || null,
        nationality: validatedData.nationality || null,
        shortDescription: validatedData.shortDescription,
        playingStyle: validatedData.playingStyle || null,
        birthYear: validatedData.birthYear || null,
        deathYear: validatedData.deathYear || null,
        achievements: validatedData.achievements ? validatedData.achievements : Prisma.JsonNull,
        famousGames: validatedData.famousGames ? validatedData.famousGames : Prisma.JsonNull,
        isActive: validatedData.isActive,
        isVisible: validatedData.isVisible,
      },
    });

    console.log("Legend created successfully:", legend.id);

    return NextResponse.json(
      {
        success: true,
        message: "Legend created successfully",
        data: {
          legend: {
            id: legend.id.toString(),
            referenceId: legend.referenceId,
            name: legend.name,
            era: legend.era,
            createdAt: legend.createdAt,
          },
        },
      },
      { status: 201 }
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

    console.error("Error creating legend:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      {
        error: "Failed to create legend",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
