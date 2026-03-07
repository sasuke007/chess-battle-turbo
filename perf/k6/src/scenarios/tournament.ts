/**
 * Tournament Test — Full lifecycle: create → join → start → play → end.
 *
 * Uses k6's setup/default/teardown lifecycle:
 *   setup()    — 1 admin creates tournament, all players join, admin starts it
 *   default()  — each VU is 1 player: find-match → play → repeat
 *   teardown() — admin ends tournament, logs final standings
 *
 * Each VU acts as ONE independent player. The tournament's find-match
 * endpoint handles pairing via FOR UPDATE SKIP LOCKED (same as quick-match
 * but scoped to tournament participants).
 *
 * VU count must be EVEN (each game needs 2 players).
 *
 * Usage:
 *   k6 run dist/tournament.js                                             # 100 players, 3 games each
 *   k6 run dist/tournament.js -e T_VUS=200 -e T_GAMES=5                  # 200 players, 5 games each
 *   k6 run dist/tournament.js -e T_VUS=50 -e T_GAMES=10 -e T_STAGGER=30  # 50 players, slower ramp
 */

import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import http from 'k6/http';
import { SharedArray } from 'k6/data';

import { CONFIG, apiUrl } from '../lib/config';
import { playSolo } from '../lib/solo-player';
import {
  httpErrorRate,
  tournamentGamesPlayed,
  tournamentJoinDuration,
  tournamentFindMatchDuration,
  tournamentMatchRate,
  tournamentFindMatchPolls,
  gameCompletionRate,
  wsConnectionSuccess,
  wsMoveDuration,
} from '../lib/metrics';
import { TestUser } from '../lib/user-pool';

const users = new SharedArray('users', function () {
  return JSON.parse(open('../setup/user-manifest.json')) as TestUser[];
});

const vuCount = parseInt(__ENV.T_VUS || '100', 10);
const gamesPerVU = parseInt(__ENV.T_GAMES || '3', 10);
const staggerSeconds = parseInt(__ENV.T_STAGGER || '60', 10);
const tournamentDuration = parseInt(__ENV.T_DURATION || '30', 10);
const joinBatchSize = parseInt(__ENV.T_JOIN_BATCH || '20', 10);

const jsonHeaders = { headers: { 'Content-Type': 'application/json' } };

export const options: Options = {
  scenarios: {
    tournament: {
      executor: 'per-vu-iterations',
      vus: vuCount,
      iterations: gamesPerVU,
      maxDuration: '60m',
    },
  },
  thresholds: {
    http_error_rate: ['rate<0.10'],
    tournament_match_rate: ['rate>0.70'],
    game_completion_rate: ['rate>0.70'],
    ws_move_duration: ['p(95)<1000'],
    ws_connection_success: ['rate>0.90'],
  },
};

interface SetupData {
  tournamentRefId: string;
  adminRefId: string;
  playerCount: number;
}

/**
 * setup() — runs once. Admin creates tournament, all players join, admin starts it.
 */
export function setup(): SetupData {
  const admin = users[0] as TestUser;
  console.log(`[setup] Admin: ${admin.referenceId.substring(0, 8)}, joining ${vuCount} players`);

  // ─── Create tournament ───
  const createRes = http.post(
    apiUrl('/api/tournament/create'),
    JSON.stringify({
      userReferenceId: admin.referenceId,
      name: `PerfTest-${Date.now()}`,
      mode: 'FREE',
      durationMinutes: tournamentDuration,
      initialTimeSeconds: CONFIG.INITIAL_TIME_SECONDS,
      incrementSeconds: CONFIG.INCREMENT_SECONDS,
      maxParticipants: null,
      scheduledStartAt: new Date().toISOString(),
    }),
    { ...jsonHeaders, tags: { name: 'tournament-create' } },
  );

  if (!check(createRes, { 'create 201': (r) => r.status === 201 })) {
    console.error(`[setup] CREATE FAILED — status=${createRes.status}, body=${createRes.body}`);
    return { tournamentRefId: '', adminRefId: admin.referenceId, playerCount: 0 };
  }

  const tournamentRefId = JSON.parse(createRes.body as string).data.referenceId;
  console.log(`[setup] Tournament created: ${tournamentRefId}`);

  // ─── Join all players (admin already joined via create) ───
  let joined = 1;
  let joinErrors = 0;

  for (let i = 1; i < vuCount; i++) {
    const userIndex = i % users.length;
    const user = users[userIndex] as TestUser;

    const joinRes = http.post(
      apiUrl('/api/tournament/join'),
      JSON.stringify({
        userReferenceId: user.referenceId,
        tournamentReferenceId: tournamentRefId,
      }),
      { ...jsonHeaders, tags: { name: 'tournament-join' } },
    );

    tournamentJoinDuration.add(joinRes.timings.duration);

    if (joinRes.status === 201 || joinRes.status === 200) {
      joined++;
    } else {
      joinErrors++;
      if (joinErrors <= 5) {
        console.error(`[setup] JOIN failed for user ${userIndex}: status=${joinRes.status}, body=${(joinRes.body as string).substring(0, 200)}`);
      }
    }

    // Stagger joins to avoid overwhelming Vercel
    if (i % joinBatchSize === 0) {
      sleep(0.5);
      if (i % 100 === 0) {
        console.log(`[setup] Joined ${joined}/${vuCount} players (${joinErrors} errors)`);
      }
    }
  }

  console.log(`[setup] Join complete: ${joined}/${vuCount} joined, ${joinErrors} errors`);

  // ─── Start tournament ───
  const startRes = http.post(
    apiUrl('/api/tournament/start'),
    JSON.stringify({
      userReferenceId: admin.referenceId,
      tournamentReferenceId: tournamentRefId,
    }),
    { ...jsonHeaders, tags: { name: 'tournament-start' } },
  );

  if (!check(startRes, { 'start 200': (r) => r.status === 200 })) {
    console.error(`[setup] START FAILED — status=${startRes.status}, body=${startRes.body}`);
  } else {
    const startData = JSON.parse(startRes.body as string).data;
    console.log(`[setup] Tournament ACTIVE — ends at ${startData.endsAt}`);
  }

  return { tournamentRefId, adminRefId: admin.referenceId, playerCount: joined };
}

/**
 * default() — each VU is 1 tournament player. Find match → play → repeat.
 */
export default function (data: SetupData) {
  if (!data.tournamentRefId) {
    console.error(`[VU${__VU}] No tournament — setup failed`);
    return;
  }

  const userIndex = (__VU - 1) % users.length;
  const user = users[userIndex] as TestUser;
  const tag = `t-VU${__VU}-i${__ITER}`;

  // Stagger first iteration
  if (__ITER === 0) {
    const delay = Math.random() * staggerSeconds;
    sleep(delay);
  }

  // ─── Find match (poll until MATCHED) ───
  let gameRefId: string | null = null;
  let pollCount = 0;
  const maxPolls = 30;

  for (let i = 0; i < maxPolls; i++) {
    const findRes = http.post(
      apiUrl('/api/tournament/find-match'),
      JSON.stringify({
        userReferenceId: user.referenceId,
        tournamentReferenceId: data.tournamentRefId,
      }),
      { ...jsonHeaders, tags: { name: 'tournament-find-match' } },
    );

    tournamentFindMatchDuration.add(findRes.timings.duration);
    pollCount++;

    if (findRes.status !== 200 && findRes.status !== 202) {
      httpErrorRate.add(1);
      const body = findRes.body as string;

      // Tournament ended or not active — stop gracefully
      if (body.includes('not active') || body.includes('not a participant')) {
        console.log(`[${tag}] Tournament ended or not participant — stopping`);
        tournamentMatchRate.add(false);
        tournamentFindMatchPolls.add(pollCount);
        return;
      }

      console.error(`[${tag}] find-match error: status=${findRes.status}`);
      sleep(2);
      continue;
    }
    httpErrorRate.add(0);

    const resBody = JSON.parse(findRes.body as string);
    const status = resBody.data?.status;

    if (status === 'MATCHED') {
      gameRefId = resBody.data.gameReferenceId;
      console.log(`[${tag}] MATCHED after ${pollCount} polls — gameRef=${gameRefId!.substring(0, 8)}`);
      break;
    }

    if (status === 'IN_GAME') {
      gameRefId = resBody.data.gameReferenceId;
      console.log(`[${tag}] IN_GAME (resuming) — gameRef=${gameRefId!.substring(0, 8)}`);
      break;
    }

    if (status === 'SEARCHING') {
      sleep(CONFIG.MATCH_POLL_INTERVAL_MS / 1000);
      continue;
    }

    console.log(`[${tag}] Unexpected find-match status: ${status}`);
    sleep(2);
  }

  tournamentFindMatchPolls.add(pollCount);

  if (!gameRefId) {
    tournamentMatchRate.add(false);
    console.error(`[${tag}] NO MATCH after ${pollCount} polls`);
    sleep(1);
    return;
  }

  tournamentMatchRate.add(true);

  // ─── Play the game (single WebSocket, my side only) ───
  playSolo(gameRefId, user.referenceId, tag);
  tournamentGamesPlayed.add(1);

  // Brief cooldown between games
  sleep(1 + Math.random() * 2);
}

/**
 * teardown() — runs once. Ends tournament and logs final standings.
 */
export function teardown(data: SetupData) {
  if (!data.tournamentRefId) return;

  // ─── End tournament ───
  const endRes = http.post(
    apiUrl('/api/tournament/end'),
    JSON.stringify({
      userReferenceId: data.adminRefId,
      tournamentReferenceId: data.tournamentRefId,
    }),
    { ...jsonHeaders, tags: { name: 'tournament-end' } },
  );

  if (endRes.status === 200) {
    console.log(`[teardown] Tournament ended successfully`);
  } else {
    console.log(`[teardown] End status=${endRes.status} (may have auto-completed)`);
  }

  // ─── Fetch final standings ───
  const detailRes = http.get(
    apiUrl(`/api/tournament/${data.tournamentRefId}`),
    { tags: { name: 'tournament-detail' } },
  );

  if (detailRes.status === 200) {
    const detail = JSON.parse(detailRes.body as string).data;
    const participants = detail.participants || [];
    console.log(`[teardown] Final standings (${participants.length} players):`);

    const top = participants.slice(0, 10);
    for (let i = 0; i < top.length; i++) {
      const p = top[i];
      console.log(`  #${i + 1} ${p.user?.name || 'Unknown'}: ${p.points}pts (W${p.wins}/L${p.losses}/D${p.draws}, ${p.gamesPlayed} games)`);
    }
    if (participants.length > 10) {
      console.log(`  ... and ${participants.length - 10} more`);
    }
  }
}

declare const __VU: number;
declare const __ITER: number;
