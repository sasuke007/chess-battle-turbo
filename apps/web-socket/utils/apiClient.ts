import {
  ApiGameResponse,
  ApiMoveRequest,
  ApiGameOverRequest,
  ApiGameStateRequest,
  GameData,
} from "../types";
import { addApiBreadcrumb, captureSocketError, trackApiLatency, trackApiError } from "./sentry";
import * as Sentry from "@sentry/node";

// Configuration
const API_BASE_URL = process.env.WEB_APP_URL || "http://localhost:3000";

/**
 * Fetch game details by reference ID
 */
export async function fetchGameByRef(
  gameReferenceId: string
): Promise<GameData> {
  const startTime = Date.now();
  try {
    addApiBreadcrumb("fetch_game_by_ref", { gameReferenceId });
    const response = await fetch(
      `${API_BASE_URL}/api/chess/game-by-ref/${gameReferenceId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as ApiGameResponse;

    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to fetch game");
    }

    trackApiLatency("fetch_game_by_ref", Date.now() - startTime);
    return result.data;
  } catch (error) {
    console.error("Error fetching game by ref:", error);
    Sentry.logger.error(Sentry.logger.fmt`Error fetching game by ref: ${gameReferenceId}`);
    trackApiError("fetch_game_by_ref");
    trackApiLatency("fetch_game_by_ref", Date.now() - startTime);
    captureSocketError(error, {
      event: "api_fetch_game",
      gameReferenceId,
    });
    throw error;
  }
}

/**
 * Persist a move to the database
 */
export async function persistMove(moveData: ApiMoveRequest): Promise<void> {
  const startTime = Date.now();
  try {
    addApiBreadcrumb("persist_move", { gameReferenceId: moveData.gameReferenceId });
    const response = await fetch(`${API_BASE_URL}/api/chess/move`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(moveData),
    });

    if (!response.ok) {
      const errorData = await response.json() as { error?: string };
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as { success: boolean; error?: string };

    if (!result.success) {
      throw new Error(result.error || "Failed to persist move");
    }

    trackApiLatency("persist_move", Date.now() - startTime);
  } catch (error) {
    console.error("Error persisting move:", error);
    trackApiError("persist_move");
    trackApiLatency("persist_move", Date.now() - startTime);
    captureSocketError(error, {
      event: "api_persist_move",
      gameReferenceId: moveData.gameReferenceId,
    });
    throw error;
  }
}

/**
 * Mark game as completed and handle wallet updates
 */
export async function completeGame(
  gameOverData: ApiGameOverRequest
): Promise<void> {
  const startTime = Date.now();
  try {
    addApiBreadcrumb("complete_game", { gameReferenceId: gameOverData.gameReferenceId });
    console.log("Calling game-over API with data:", gameOverData);

    const response = await fetch(`${API_BASE_URL}/api/chess/game-over`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gameOverData),
    });

    console.log("Game-over API response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json() as { error?: string; details?: any };
      console.error("Game-over API error response:", errorData);
      const errorMessage = errorData.details
        ? `${errorData.error}: ${JSON.stringify(errorData.details)}`
        : errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const result = await response.json() as { success: boolean; error?: string; details?: any };
    console.log("Game-over API result:", result);

    if (!result.success) {
      console.error("Game-over API returned success: false", result);
      const errorMessage = result.details
        ? `${result.error}: ${JSON.stringify(result.details)}`
        : result.error || "Failed to complete game";
      throw new Error(errorMessage);
    }

    trackApiLatency("complete_game", Date.now() - startTime);
    console.log("Game completed successfully in database");
    Sentry.logger.info(Sentry.logger.fmt`Game completed successfully: ${gameOverData.gameReferenceId}`);
  } catch (error) {
    console.error("Error completing game:", error);
    Sentry.logger.error(Sentry.logger.fmt`Error completing game: ${gameOverData.gameReferenceId}`);
    trackApiError("complete_game");
    trackApiLatency("complete_game", Date.now() - startTime);
    captureSocketError(error, {
      event: "api_complete_game",
      gameReferenceId: gameOverData.gameReferenceId,
      extra: { result: gameOverData.result, method: gameOverData.method },
    });
    throw error;
  }
}

/**
 * Update game state (clocks) without a move
 */
export async function updateGameState(
  stateData: ApiGameStateRequest
): Promise<void> {
  const startTime = Date.now();
  try {
    addApiBreadcrumb("update_game_state", { gameReferenceId: stateData.gameReferenceId });
    const response = await fetch(`${API_BASE_URL}/api/chess/game-state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stateData),
    });

    if (!response.ok) {
      const errorData = await response.json() as { error?: string };
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as { success: boolean; error?: string };

    if (!result.success) {
      throw new Error(result.error || "Failed to update game state");
    }

    trackApiLatency("update_game_state", Date.now() - startTime);
  } catch (error) {
    console.error("Error updating game state:", error);
    Sentry.logger.error(Sentry.logger.fmt`Error updating game state: ${stateData.gameReferenceId}`);
    trackApiError("update_game_state");
    trackApiLatency("update_game_state", Date.now() - startTime);
    captureSocketError(error, {
      event: "api_update_game_state",
      gameReferenceId: stateData.gameReferenceId,
    });
    // Non-critical error, log but don't throw
    console.warn("Continuing despite game state update failure");
  }
}
