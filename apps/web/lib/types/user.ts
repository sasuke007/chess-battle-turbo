export interface UserWallet {
  referenceId: string;
  balance: string;
  lockedAmount: string;
  availableBalance: string;
  updatedAt: Date | string;
}

export interface UserStats {
  referenceId: string;
  totalGamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  winRate: string;
  totalMoneyWon: string;
  totalMoneyLost: string;
  netProfit: string;
  currentWinStreak: number;
  longestWinStreak: number;
  averageGameDuration: number | null;
  lastPlayedAt: Date | string | null;
}

export interface User {
  referenceId: string;
  code: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;
  dateOfBirth: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
}

export interface CompleteUserObject {
  user: User;
  wallet: UserWallet | null;
  stats: UserStats | null;
}

export interface UserApiResponse {
  success: boolean;
  data: CompleteUserObject;
}

