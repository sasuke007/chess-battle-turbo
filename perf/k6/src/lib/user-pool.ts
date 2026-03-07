/**
 * User pool: deterministic VU → user pair mapping.
 *
 * 500 pre-created users. Each VU gets a pair:
 *   VU 0   → users[0] + users[1]
 *   VU 1   → users[2] + users[3]
 *   ...
 *   VU 249 → users[498] + users[499]
 */

export interface TestUser {
  clerkId: string;
  email: string;
  referenceId: string;
  token?: string; // Clerk JWT for tournament routes
}

export interface UserPair {
  playerA: TestUser;
  playerB: TestUser;
}

// Loaded from setup/user-manifest.json via SharedArray in k6
let _users: TestUser[] = [];

export function setUsers(users: TestUser[]): void {
  _users = users;
}

export function getUsers(): TestUser[] {
  return _users;
}

/**
 * Get the user pair for a given VU index (0-based).
 * VU n → users[n*2] and users[n*2+1]
 */
export function getUserPair(vuIndex: number): UserPair {
  const i = vuIndex * 2;
  if (i + 1 >= _users.length) {
    throw new Error(
      `VU index ${vuIndex} exceeds user pool (${_users.length} users, max VU = ${Math.floor(_users.length / 2) - 1})`,
    );
  }
  return {
    playerA: _users[i]!,
    playerB: _users[i + 1]!,
  };
}

/**
 * Get a single user by index.
 */
export function getUser(index: number): TestUser {
  if (index >= _users.length) {
    throw new Error(`User index ${index} exceeds pool (${_users.length} users)`);
  }
  return _users[index]!;
}

/**
 * Total number of available user pairs (max VUs for paired scenarios).
 */
export function maxPairs(): number {
  return Math.floor(_users.length / 2);
}
