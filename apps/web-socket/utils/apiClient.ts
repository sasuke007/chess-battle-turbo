import {
  ApiGameResponse,
  ApiMoveRequest,
  ApiGameOverRequest,
  ApiGameStateRequest,
  GameData,
} from "../types";

// Configuration
const API_BASE_URL = process.env.WEB_APP_URL || "http://localhost:3000";

/**
 * Fetch game details by reference ID
 */
export async function fetchGameByRef(
  gameReferenceId: string
): Promise<GameData> {
  try {
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

    return result.data;
  } catch (error) {
    console.error("Error fetching game by ref:", error);
    throw error;
  }
}

/**
 * Persist a move to the database
 */
export async function persistMove(moveData: ApiMoveRequest): Promise<void> {
  try {
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
  } catch (error) {
    console.error("Error persisting move:", error);
    throw error;
  }
}

/**
 * Mark game as completed and handle wallet updates
 */
export async function completeGame(
  gameOverData: ApiGameOverRequest
): Promise<void> {
  try {
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
    
    console.log("Game completed successfully in database");
  } catch (error) {
    console.error("Error completing game:", error);
    throw error;
  }
}

/**
 * Update game state (clocks) without a move
 */
export async function updateGameState(
  stateData: ApiGameStateRequest
): Promise<void> {
  try {
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
  } catch (error) {
    console.error("Error updating game state:", error);
    // Non-critical error, log but don't throw
    console.warn("Continuing despite game state update failure");
  }
}
