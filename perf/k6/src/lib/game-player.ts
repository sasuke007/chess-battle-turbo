/**
 * GamePlayer — plays a full chess game over WebSocket.
 *
 * Uses k6/websockets (non-blocking). The VU stays alive while sockets are open.
 * When game_over is received, both sockets close and the VU iteration ends.
 *
 * IMPORTANT: This function sets up event-driven WebSocket handlers and returns
 * immediately. The game plays out asynchronously via the k6 event loop.
 * The VU iteration ends when both sockets close.
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
 * Start playing a game over WebSocket. This is event-driven and non-blocking.
 *
 * The function opens two WebSocket connections, joins the game, waits for
 * analysis phase, plays moves, and resigns after MIN_MOVES. The VU iteration
 * stays alive until both sockets close (on game_over or timeout).
 */
export function playGame(
  gameRefId: string,
  playerARef: string,
  playerBRef: string,
  tag: string = 'game',
): void {
  const gameStart = Date.now();
  const shortRef = gameRefId.substring(0, 8);
  const log = (msg: string) => console.log(`[${tag}][${shortRef}] ${msg}`);
  const logErr = (msg: string) => console.error(`[${tag}][${shortRef}] ERROR: ${msg}`);

  // ─── Shared mutable state ───
  let currentFen = '';
  let gameStarted = false;
  let gameOver = false;
  let moveCount = 0;
  let pendingMoveTime = 0;
  let analysisReceived = false;

  let colorA: 'w' | 'b' | null = null;
  let colorB: 'w' | 'b' | null = null;

  let analysisStartedAt = 0;
  let gameStartedAt = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const url = wsUrl();

  log(`Starting: playerA=${playerARef.substring(0, 8)} playerB=${playerBRef.substring(0, 8)}`);

  // ─── Move helper ───
  function tryMakeMove(
    socket: WebSocket,
    myColor: 'w' | 'b' | null,
    playerLabel: string,
  ) {
    if (!gameStarted || gameOver || !myColor) return;

    const turn = getTurn(currentFen);
    if (turn !== myColor) return;

    const move = pickRandomMove(currentFen);
    if (!move) {
      log(`${playerLabel}: No legal moves — checkmate/stalemate`);
      return;
    }

    log(`${playerLabel}[${myColor}]: Move #${moveCount + 1} → ${move.from}${move.to}${move.promotion ? '=' + move.promotion : ''}`);

    pendingMoveTime = Date.now();
    socket.send(encodeEvent('make_move', {
      gameReferenceId: gameRefId,
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    }));
  }

  // ─── Close everything and record metrics ───
  function finish(error?: string) {
    if (gameOver) return; // already finished

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
      logErr(`FAILED: gameStarted=${gameStarted}, analysis=${analysisReceived}, colorA=${colorA}, colorB=${colorB}`);
      logErr(`FAILED: Last FEN: ${currentFen || '(none)'}`);
    }

    gameOver = true;
    if (timeoutId !== null) { clearTimeout(timeoutId); timeoutId = null; }
    try { socketA.close(); } catch (_) {}
    try { socketB.close(); } catch (_) {}
  }

  // ─── Create message handler ───
  function createHandler(socket: WebSocket, playerLabel: string, playerRef: string, isPlayerA: boolean) {
    return function (e: MessageEvent) {
      const raw = e.data as string;
      if (handlePing(socket, raw)) return;

      const msg = decode(raw);

      if (msg.type === 'open') {
        log(`${playerLabel}: EIO open (sid=${(msg.data as any).sid?.substring(0, 8)}), sending SIO connect`);
        socket.send(connectPacket());
        return;
      }

      if (msg.type === 'connected') {
        log(`${playerLabel}: SIO ready, sending join_game`);
        socket.send(encodeEvent('join_game', {
          gameReferenceId: gameRefId,
          userReferenceId: playerRef,
        }));
        return;
      }

      if (msg.type === 'disconnect') {
        logErr(`${playerLabel}: Server SIO disconnect`);
        finish(`${playerLabel}: Server disconnected`);
        return;
      }

      if (msg.type === 'unknown') {
        log(`${playerLabel}: Unknown msg: ${(msg as any).raw?.substring(0, 50)}`);
        return;
      }

      if (msg.type !== 'event') return;

      // ─── Events ───

      if (matchEvent(msg, 'waiting_for_opponent')) {
        log(`${playerLabel}: waiting_for_opponent`);
        return;
      }

      const analysis = matchEvent<{
        yourColor: 'w' | 'b'; fen: string; analysisTimeSeconds: number;
        whitePlayer?: { userReferenceId: string }; blackPlayer?: { userReferenceId: string };
      }>(msg, 'analysis_phase_started');
      if (analysis) {
        analysisReceived = true;
        if (isPlayerA) {
          colorA = analysis.yourColor;
          currentFen = analysis.fen;
          analysisStartedAt = Date.now();
          log(`${playerLabel}: analysis_phase_started — color=${colorA}, time=${analysis.analysisTimeSeconds}s`);
          log(`${playerLabel}: FEN=${currentFen}`);
        } else {
          colorB = analysis.yourColor;
          log(`${playerLabel}: analysis_phase_started — color=${colorB}`);
        }
        return;
      }

      const tick = matchEvent<{ remainingSeconds: number }>(msg, 'analysis_tick');
      if (tick) {
        if (isPlayerA && (tick.remainingSeconds % 5 === 0 || tick.remainingSeconds <= 3)) {
          log(`${playerLabel}: analysis_tick — ${tick.remainingSeconds}s remaining`);
        }
        return;
      }

      const started = matchEvent<{ fen: string }>(msg, 'game_started');
      if (started) {
        gameStarted = true;
        currentFen = started.fen;

        if (isPlayerA) {
          gameStartedAt = Date.now();
          const waitMs = analysisStartedAt > 0 ? Date.now() - analysisStartedAt : 0;
          log(`${playerLabel}: game_started — analysis took ${waitMs}ms, FEN=${started.fen}`);
        } else {
          log(`${playerLabel}: game_started — FEN=${started.fen}`);
        }

        const myColor = isPlayerA ? colorA : colorB;
        tryMakeMove(socket, myColor, playerLabel);
        return;
      }

      const moved = matchEvent<{ fen: string; san: string; from: string; to: string; turn: 'w' | 'b' }>(msg, 'move_made');
      if (moved && !gameOver) {
        currentFen = moved.fen;
        moveCount++;

        if (pendingMoveTime > 0) {
          const lat = Date.now() - pendingMoveTime;
          wsMoveDuration.add(lat);
          log(`${playerLabel}: move_made #${moveCount} — ${moved.san} (${moved.from}→${moved.to}), latency=${lat}ms`);
          pendingMoveTime = 0;
        } else {
          log(`${playerLabel}: move_made #${moveCount} — ${moved.san} (opponent's move)`);
        }

        if (isPlayerA && (moveCount >= CONFIG.MIN_MOVES || isGameOver(currentFen))) {
          log(`${playerLabel}: ${moveCount} moves reached, resigning`);
          socket.send(encodeEvent('resign', { gameReferenceId: gameRefId }));
          return;
        }

        const myColor = isPlayerA ? colorA : colorB;
        setTimeout(function () {
          tryMakeMove(socket, myColor, playerLabel);
        }, randomThinkTime());
        return;
      }

      const gameOverData = matchEvent<{ result: string; method: string; winner: string | null }>(msg, 'game_over');
      if (gameOverData) {
        const playTime = gameStartedAt > 0 ? Date.now() - gameStartedAt : 0;
        log(`${playerLabel}: game_over — result=${gameOverData.result}, method=${gameOverData.method}, winner=${gameOverData.winner}, moves=${moveCount}, playTime=${playTime}ms`);
        finish(); // success!
        return;
      }

      const moveErr = matchEvent<{ message: string }>(msg, 'move_error');
      if (moveErr) {
        logErr(`${playerLabel}: move_error — ${moveErr.message}`);
        logErr(`${playerLabel}: FEN: ${currentFen}, color: ${isPlayerA ? colorA : colorB}`);
        return;
      }

      const errData = matchEvent<{ message: string }>(msg, 'error');
      if (errData) {
        logErr(`${playerLabel}: server error — ${errData.message}`);
        finish(`${playerLabel} server error: ${errData.message}`);
        return;
      }

      if (matchEvent(msg, 'opponent_disconnected')) { log(`${playerLabel}: opponent_disconnected`); return; }
      if (matchEvent(msg, 'opponent_reconnected')) { log(`${playerLabel}: opponent_reconnected`); return; }
      if (matchEvent(msg, 'clock_update')) { return; } // Ignore frequent clock ticks

      log(`${playerLabel}: Unhandled event "${(msg as any).name}"`);
    };
  }

  // ─── Open both connections (non-blocking) ───
  const wsStartA = Date.now();
  const socketA = new WebSocket(url);
  const wsStartB = Date.now();
  const socketB = new WebSocket(url);

  socketA.addEventListener('open', function () {
    wsConnectionSuccess.add(1);
    wsConnectDuration.add(Date.now() - wsStartA);
    log(`PlayerA: WS connected (${Date.now() - wsStartA}ms)`);
  });

  socketB.addEventListener('open', function () {
    wsConnectionSuccess.add(1);
    wsConnectDuration.add(Date.now() - wsStartB);
    log(`PlayerB: WS connected (${Date.now() - wsStartB}ms)`);
  });

  socketA.addEventListener('message', createHandler(socketA, 'PlayerA', playerARef, true));
  socketB.addEventListener('message', createHandler(socketB, 'PlayerB', playerBRef, false));

  socketA.addEventListener('error', function (e) {
    wsConnectionSuccess.add(0);
    logErr(`PlayerA: WS error — ${(e as any).error || 'unknown'}`);
  });

  socketB.addEventListener('error', function (e) {
    wsConnectionSuccess.add(0);
    logErr(`PlayerB: WS error — ${(e as any).error || 'unknown'}`);
  });

  socketA.addEventListener('close', function () {
    log(`PlayerA: WS closed (gameOver=${gameOver}, moves=${moveCount})`);
  });

  socketB.addEventListener('close', function () {
    log(`PlayerB: WS closed (gameOver=${gameOver}, moves=${moveCount})`);
  });

  // ─── Timeout: close everything after 120s ───
  timeoutId = setTimeout(function () {
    if (!gameOver) {
      finish(`Timeout after 120s — started=${gameStarted}, analysis=${analysisReceived}, moves=${moveCount}`);
    }
  }, 120_000);
}
