import { prisma } from '../lib/prisma';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create dummy users with wallets
  const users = [
    {
      code: 'ALICE001',
      googleId: 'google_alice_123456',
      email: 'alice@chessbattle.com',
      name: 'Alice Johnson',
      profilePictureUrl: 'https://i.pravatar.cc/150?img=1',
      dateOfBirth: new Date('1995-03-15'),
      isActive: true,
    },
    {
      code: 'BOB002',
      googleId: 'google_bob_789012',
      email: 'bob@chessbattle.com',
      name: 'Bob Smith',
      profilePictureUrl: 'https://i.pravatar.cc/150?img=2',
      dateOfBirth: new Date('1992-07-22'),
      isActive: true,
    },
    {
      code: 'CHARLIE003',
      googleId: 'google_charlie_345678',
      email: 'charlie@chessbattle.com',
      name: 'Charlie Davis',
      profilePictureUrl: 'https://i.pravatar.cc/150?img=3',
      dateOfBirth: new Date('1998-11-08'),
      isActive: true,
    },
    {
      code: 'DIANA004',
      googleId: 'google_diana_901234',
      email: 'diana@chessbattle.com',
      name: 'Diana Martinez',
      profilePictureUrl: 'https://i.pravatar.cc/150?img=4',
      dateOfBirth: new Date('1994-05-30'),
      isActive: true,
    },
    {
      code: 'EVAN005',
      googleId: 'google_evan_567890',
      email: 'evan@chessbattle.com',
      name: 'Evan Wilson',
      profilePictureUrl: 'https://i.pravatar.cc/150?img=5',
      dateOfBirth: new Date('1996-09-12'),
      isActive: true,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        wallet: {
          create: {
            balance: 1000.00,
            lockedAmount: 0,
          },
        },
        stats: {
          create: {
            totalGamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            gamesDrawn: 0,
            totalMoneyWon: 0,
            totalMoneyLost: 0,
            totalPlatformFeesPaid: 0,
            netProfit: 0,
            currentWinStreak: 0,
            longestWinStreak: 0,
          },
        },
      },
    });

    console.log(`✅ Created user: ${user.name} (${user.email}) - Reference ID: ${user.referenceId}`);
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

