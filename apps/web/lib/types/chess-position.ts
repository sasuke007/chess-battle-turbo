import { z } from 'zod';

// ============================================
// Zod Schemas for Validation
// ============================================

export const createChessPositionSchema = z.object({
  fen: z.string().min(1, 'FEN is required'),
  sideToMove: z.string().min(1, 'Side to move is required'),
  pgn: z.string().optional(),
  moveNumber: z.number().int().positive().optional(),
  whitePlayerName: z.string().optional(),
  blackPlayerName: z.string().optional(),
  whitePlayerMetadata: z.record(z.string(), z.any()).optional(),
  blackPlayerMetadata: z.record(z.string(), z.any()).optional(),
  tournamentName: z.string().optional(),
  eventDate: z.union([z.string(), z.date()]).optional(),
  gameMetadata: z.record(z.string(), z.any()).optional(),
  positionType: z.string().optional(),
  positionContext: z.record(z.string(), z.any()).optional(),
  sourceType: z.string().default('manual'),
  sourceMetadata: z.record(z.string(), z.any()).optional(),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateChessPositionSchema = z.object({
  fen: z.string().min(1).optional(),
  sideToMove: z.string().min(1).optional(),
  pgn: z.string().optional(),
  moveNumber: z.number().int().positive().optional(),
  whitePlayerName: z.string().optional(),
  blackPlayerName: z.string().optional(),
  whitePlayerMetadata: z.record(z.string(), z.any()).optional(),
  blackPlayerMetadata: z.record(z.string(), z.any()).optional(),
  tournamentName: z.string().optional(),
  eventDate: z.union([z.string(), z.date()]).optional(),
  gameMetadata: z.record(z.string(), z.any()).optional(),
  positionType: z.string().optional(),
  positionContext: z.record(z.string(), z.any()).optional(),
  sourceType: z.string().optional(),
  sourceMetadata: z.record(z.string(), z.any()).optional(),
  timesPlayed: z.number().int().min(0).optional(),
  popularityScore: z.number().optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// TypeScript Interfaces/Types
// ============================================

export interface ChessPosition {
  referenceId: string;
  fen: string;
  sideToMove: string;
  pgn?: string | null;
  moveNumber?: number | null;
  whitePlayerName?: string | null;
  blackPlayerName?: string | null;
  whitePlayerMetadata?: Record<string, any> | null;
  blackPlayerMetadata?: Record<string, any> | null;
  tournamentName?: string | null;
  eventDate?: Date | string | null;
  gameMetadata?: Record<string, any> | null;
  positionType?: string | null;
  positionContext?: Record<string, any> | null;
  sourceType: string;
  sourceMetadata?: Record<string, any> | null;
  timesPlayed: number;
  popularityScore?: number | null;
  featured: boolean;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ChessPositionListItem {
  referenceId: string;
  fen: string;
  sideToMove: string;
  whitePlayerName?: string | null;
  blackPlayerName?: string | null;
  tournamentName?: string | null;
  eventDate?: Date | string | null;
  positionType?: string | null;
  sourceType: string;
  timesPlayed: number;
  featured: boolean;
  createdAt: Date | string;
}

export interface ChessPositionApiResponse {
  success: boolean;
  data: ChessPosition;
}

export interface ChessPositionListApiResponse {
  success: boolean;
  data: ChessPositionListItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Inferred Types from Zod Schemas
// ============================================

export type CreateChessPositionDto = z.infer<typeof createChessPositionSchema>;
export type UpdateChessPositionDto = z.infer<typeof updateChessPositionSchema>;