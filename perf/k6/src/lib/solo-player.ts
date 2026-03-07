/**
 * SoloPlayer — plays one side of a chess game over a single WebSocket.
 *
 * Unlike playGame() which controls both players from one VU, playSolo()
 * controls just ONE player. Used for matchmaking tests where each VU
 * is an independent player matched by the server.
 *
 * Event-driven and non-blocking. The VU stays alive while the socket is open.
 */

import { WebSocket } from 'k6/websockets';
import { setTimeout, clearTimeout } from 'k6/timers';

import { CONFIG, wsUrl, randomThinkTime } from './config';
import { decode, encodeEvent, connectPacket, handlePing, matchEvent } from './socket-io';
import { pickRandomMove, getTurn, isGameOver } from './chess-engine';
import {
  wsConnectDuration,
  wsMoveDuration,
  wsConnectionSuccess,
  gameCompletionRate,
  gameMoveCount,
  gameTotalDuration,
  gamesCompleted,
  gamesFailed,
} from './metrics';

/**
 * Play one side of a game over a single WebSocket connection.
 *
 * The function opens one WebSocket, joins the game, waits for analysis,
 * plays moves on its turn, and resigns after MIN_MOVES total moves.
 * The VU iteration stays alive until the socket closes.
 */
export function playSolo(
  gameRefId: string,
  myReferenceId: string,
  tag: string = 'solo',
  timeoutMs: number = 120_000,
): void {
  const gameStart = Date.now();
  const shortRef = gameRefId.substring(0, 8);
  const log = (msg: string) => console.log(`[${tag}][${shortRef}] ${msg}`);
  const logErr = (msg: string) => console.error(`[${tag}][${shortRef}] ERROR: ${msg}`);

  // ─── Mutable state ───
  let currentFen = '';
  let gameStarted = false;
  let gameOver = false;
  let moveCount = 0;
  let pendingMoveTime = 0;

  let myColor: 'w' | 'b' | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const url = wsUrl();

  log(`Starting solo: player=${myReferenceId.substring(0, 8)}`);

  // ─── Move helper ───
  function tryMakeMove() {
    if (!gameStarted || gameOver || !myColor) return;

    const turn = getTurn(currentFen);
    if (turn !== myColor) return;

    const move = pickRandomMove(currentFen);
    if (!move) {
      log(`No legal moves — checkmate/stalemate`);
      return;
    }

    log(`[${myColor}]: Move → ${move.from}${move.to}${move.promotion ? '=' + move.promotion : ''}`);

    pendingMoveTime = Date.now();
    socket.send(encodeEvent('make_move', {
      gameReferenceId: gameRefId,
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    }));
  }

  // ─── Finish and record metrics ───
  function finish(error?: string) {
    if (gameOver) return;

    const durationMs = Date.now() - gameStart;

    if (!error) {
      gamesCompleted.add(1);
      gameCompletionRate.add(true);
      gameMoveCount.add(moveCount);
      gameTotalDuration.add(durationMs);
      log(`COMPLETE: ${moveCount} moves in ${(durationMs / 1000).toFixed(1)}s`);
    } else {
      gamesFailed.add(1);
      gameCompletionRate.add(false);
      logErr(`FAILED: ${error} — duration=${(durationMs / 1000).toFixed(1)}s, moves=${moveCount}`);
      logErr(`FAILED: gameStarted=${gameStarted}, myColor=${myColor}, FEN=${currentFen || '(none)'}`);
    }

    gameOver = true;
    if (timeoutId !== null) { clearTimeout(timeoutId); timeoutId = null; }
    try { socket.close(); } catch (_) {}
  }

  // ─── Open WebSocket ───
  const wsStartTime = Date.now();
  const socket = new WebSocket(url);

  socket.addEventListener('open', function () {
    wsConnectionSuccess.add(1);
    wsConnectDuration.add(Date.now() - wsStartTime);
    log(`WS connected (${Date.now() - wsStartTime}ms)`);
  });

  socket.addEventListener('error', function (e) {
    wsConnectionSuccess.add(0);
    logErr(`WS error — ${(e as any).error || 'unknown'}`);
  });

  socket.addEventListener('close', function () {
    log(`WS closed (gameOver=${gameOver}, moves=${moveCount})`);
  });

  // ─── Message handler ───
  socket.addEventListener('message', function (e) {
    const raw = e.data as string;
    if (handlePing(socket, raw)) return;

    const msg = decode(raw);

    if (msg.type === 'open') {
      log(`EIO open (sid=${(msg.data as any).sid?.substring(0, 8)}), sending SIO connect`);
      socket.send(connectPacket());
      return;
    }

    if (msg.type === 'connected') {
      log(`SIO ready, sending join_game`);
      socket.send(encodeEvent('join_game', {
        gameReferenceId: gameRefId,
        userReferenceId: myReferenceId,
      }));
      return;
    }

    if (msg.type === 'disconnect') {
      logErr(`Server SIO disconnect`);
      finish('Server disconnected');
      return;
    }

    if (msg.type === 'unknown') return;
    if (msg.type !== 'event') return;

    // ─── Events ───

    if (matchEvent(msg, 'waiting_for_opponent')) {
      log(`waiting_for_opponent`);
      return;
    }

    const analysis = matchEvent<{
      yourColor: 'w' | 'b'; fen: string; analysisTimeSeconds: number;
    }>(msg, 'analysis_phase_started');
    if (analysis) {
      myColor = analysis.yourColor;
      currentFen = analysis.fen;
      log(`analysis_phase_started — color=${myColor}, time=${analysis.analysisTimeSeconds}s`);
      return;
    }

    if (matchEvent(msg, 'analysis_tick')) return; // Silence ticks

    const started = matchEvent<{ fen: string }>(msg, 'game_started');
    if (started) {
      gameStarted = true;
      currentFen = started.fen;
      log(`game_started — FEN=${started.fen}`);
      tryMakeMove();
      return;
    }

    const moved = matchEvent<{ fen: string; san: string; from: string; to: string; turn: 'w' | 'b' }>(msg, 'move_made');
    if (moved && !gameOver) {
      currentFen = moved.fen;
      moveCount++;

      if (pendingMoveTime > 0) {
        const lat = Date.now() - pendingMoveTime;
        wsMoveDuration.add(lat);
        log(`move_made #${moveCount} — ${moved.san} (mine), latency=${lat}ms`);
        pendingMoveTime = 0;
      } else {
        log(`move_made #${moveCount} — ${moved.san} (opponent)`);
      }

      // Resign after enough moves or if game is naturally over
      if (moveCount >= CONFIG.MIN_MOVES || isGameOver(currentFen)) {
        log(`${moveCount} moves reached, resigning`);
        socket.send(encodeEvent('resign', { gameReferenceId: gameRefId }));
        return;
      }

      // Try to make a move after think time (only does something if it's my turn)
      setTimeout(function () {
        tryMakeMove();
      }, randomThinkTime());
      return;
    }

    const gameOverData = matchEvent<{ result: string; method: string; winner: string | null }>(msg, 'game_over');
    if (gameOverData) {
      log(`game_over — result=${gameOverData.result}, method=${gameOverData.method}, winner=${gameOverData.winner}`);
      finish(); // success
      return;
    }

    const moveErr = matchEvent<{ message: string }>(msg, 'move_error');
    if (moveErr) {
      logErr(`move_error — ${moveErr.message}`);
      return;
    }

    const errData = matchEvent<{ message: string }>(msg, 'error');
    if (errData) {
      logErr(`server error — ${errData.message}`);
      finish(`server error: ${errData.message}`);
      return;
    }

    if (matchEvent(msg, 'opponent_disconnected')) { log(`opponent_disconnected`); return; }
    if (matchEvent(msg, 'opponent_reconnected')) { log(`opponent_reconnected`); return; }
    if (matchEvent(msg, 'clock_update')) { return; }

    log(`Unhandled event "${(msg as any).name}"`);
  });

  // ─── Timeout: close after timeoutMs ───
  timeoutId = setTimeout(function () {
    if (!gameOver) {
      finish(`Timeout after ${timeoutMs / 1000}s — started=${gameStarted}, color=${myColor}, moves=${moveCount}`);
    }
  }, timeoutMs);
}
