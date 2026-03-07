/**
 * Custom k6 metrics for chess game load testing.
 */

import { Counter, Rate, Trend, Gauge } from 'k6/metrics';

// --- HTTP Metrics ---
export const httpCreateGameDuration = new Trend('http_create_game_duration', true);
export const httpJoinGameDuration = new Trend('http_join_game_duration', true);
export const httpMatchmakingDuration = new Trend('http_matchmaking_duration', true);
export const httpErrorRate = new Rate('http_error_rate');

// --- WebSocket Metrics ---
export const wsConnectDuration = new Trend('ws_connect_duration', true);
export const wsMoveDuration = new Trend('ws_move_duration', true);
export const wsConnectionSuccess = new Rate('ws_connection_success');

// --- Game Metrics ---
export const gameCompletionRate = new Rate('game_completion_rate');
export const gameMoveCount = new Trend('game_move_count');
export const gameTotalDuration = new Trend('game_total_duration', true);
export const gamesCompleted = new Counter('games_completed');
export const gamesFailed = new Counter('games_failed');

// --- Matchmaking Metrics ---
export const matchmakingMatchRate = new Rate('matchmaking_match_rate');
export const matchmakingPollCount = new Trend('matchmaking_poll_count');

// --- Tournament Metrics ---
export const tournamentGamesPlayed = new Counter('tournament_games_played');
export const tournamentJoinDuration = new Trend('tournament_join_duration', true);
export const tournamentFindMatchDuration = new Trend('tournament_find_match_duration', true);
export const tournamentMatchRate = new Rate('tournament_match_rate');
export const tournamentFindMatchPolls = new Trend('tournament_find_match_polls');

// --- Active State ---
export const activeGames = new Gauge('active_games');
export const activeWsConnections = new Gauge('active_ws_connections');
