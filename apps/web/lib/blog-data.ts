export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  featured?: boolean;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "the-immortal-game-how-anderssen-changed-chess-forever",
    title: "The Immortal Game: How Anderssen Changed Chess Forever",
    excerpt:
      "In 1851, Adolf Anderssen played what many consider the most beautiful chess game ever recorded. We explore how this masterpiece shaped modern attacking chess.",
    category: "Legends",
    date: "Jan 28, 2026",
    readTime: "8 min read",
    featured: true,
    content: `In the summer of 1851, during a break from the first international chess tournament in London, Adolf Anderssen sat down for a casual game against Lionel Kieseritzky. Neither player could have known that their informal match would become the most celebrated chess game in history.

## The Setup

The game opened with the King's Gambit — 1.e4 e5 2.f4 — an opening that epitomized the Romantic era of chess. Anderssen, playing White, was willing to sacrifice material for the sake of attack, a philosophy that defined his approach to the game.

## The Sacrifice

What makes the Immortal Game truly remarkable is Anderssen's willingness to sacrifice both rooks and his bishop, ultimately delivering checkmate with just three minor pieces. The final position is a testament to the power of piece activity over material advantage.

## The Legacy

The Immortal Game changed how players thought about chess. It demonstrated that imagination and tactical vision could triumph over material considerations. Today, it remains a touchstone for attacking players and a reminder that chess is, at its heart, an art form.

Anderssen went on to win the London tournament, cementing his reputation as the strongest player in the world. His legacy lives on in every daring sacrifice and brilliant combination played on boards around the globe.`,
  },
  {
    slug: "5-opening-principles-every-player-should-know",
    title: "5 Opening Principles Every Player Should Know",
    excerpt:
      "Control the center, develop your pieces, and castle early — but there's more nuance than you think.",
    category: "Strategy",
    date: "Jan 22, 2026",
    readTime: "5 min read",
    content: `The opening phase of a chess game sets the stage for everything that follows. While most players know the basics — control the center, develop pieces, castle early — the nuance behind these principles separates club players from masters.

## 1. Control the Center

The four central squares (e4, d4, e5, d5) are the most important real estate on the board. Pieces placed in or near the center control the most squares and have the greatest mobility.

## 2. Develop with Purpose

Every piece should be developed to a square where it serves a strategic function. Don't just move pieces to get them out — place them where they support your plans.

## 3. Castle Early

King safety is paramount. Castling not only tucks your king away but also connects your rooks, allowing them to work together on the central files.

## 4. Don't Move the Same Piece Twice

In the opening, tempo is everything. Each move should bring a new piece into the game. Moving the same piece multiple times gives your opponent free development.

## 5. Create a Plan

The opening isn't just about memorizing moves — it's about understanding the resulting middlegame structures. Study the typical plans that arise from your favorite openings.`,
  },
  {
    slug: "replaychess-v2-4-new-analysis-engine",
    title: "ReplayChess v2.4: New Analysis Engine",
    excerpt:
      "Our latest update brings a dramatically improved analysis engine with 3x faster evaluation and deeper search depth.",
    category: "Updates",
    date: "Jan 18, 2026",
    readTime: "3 min read",
    content: `We're thrilled to announce ReplayChess v2.4, our biggest technical update yet. The centerpiece is a completely revamped analysis engine that delivers deeper, faster, and more accurate evaluations.

## What's New

### 3x Faster Evaluation
Our new engine processes positions three times faster than before, providing near-instant feedback on your moves. Whether you're reviewing a game or analyzing a position, you'll notice the difference immediately.

### Deeper Search
The engine now searches to greater depths by default, catching tactical nuances that were previously missed. This means more accurate evaluations and better move suggestions.

### Improved Move Explanations
Each suggested move now comes with a natural-language explanation of why it's recommended, making it easier to learn from the engine's analysis.

## Coming Soon

We're already working on v2.5, which will introduce voice-guided analysis and collaborative review sessions. Stay tuned!`,
  },
  {
    slug: "bobby-fischers-endgame-mastery",
    title: "Bobby Fischer's Endgame Mastery",
    excerpt:
      "A deep dive into Fischer's legendary endgame technique and how you can apply his principles to your own games.",
    category: "Legends",
    date: "Jan 12, 2026",
    readTime: "7 min read",
    content: `Bobby Fischer's endgame technique was so refined that many opponents resigned positions that appeared drawn to lesser players. His understanding of piece activity, pawn structure, and the subtleties of king play set a standard that remains unmatched.

## The Fischer Method

Fischer's approach to endgames was built on a few key principles:

### Activity Above All
Fischer always prioritized piece activity. Even in seemingly equal positions, he would find ways to make his pieces more active than his opponent's, gradually building small advantages into winning ones.

### Pawn Structure Mastery
No player understood pawn structures better than Fischer. He could assess at a glance whether a position favored the side with a bishop or a knight, and he was ruthless in exploiting structural weaknesses.

### The King as a Fighting Piece
In the endgame, the king transforms from a liability into a powerful piece. Fischer was a master at activating his king, often marching it deep into enemy territory to support passed pawns or attack weak squares.

## Lessons for Your Game

Study Fischer's endgames and you'll notice a pattern: simplicity. He didn't try to calculate complicated variations — instead, he made the best move in each position, trusting that small advantages would accumulate. That patience and precision is something every player can develop.`,
  },
  {
    slug: "community-tournament-recap-winter-open-2026",
    title: "Community Tournament Recap: Winter Open 2026",
    excerpt:
      "Over 200 players competed in our biggest tournament yet. Here are the highlights, upsets, and brilliant games.",
    category: "Community",
    date: "Jan 8, 2026",
    readTime: "4 min read",
    content: `The Winter Open 2026 was our most ambitious community tournament to date, with over 200 players competing across three rating sections. Here's a look at the highlights.

## By the Numbers

- **212 participants** from 14 countries
- **636 games** played over 3 days
- **47 decisive games** in the Open section alone
- **Average game duration**: 28 minutes

## Highlights

### The Upset of the Tournament
In Round 3 of the Open section, an unrated newcomer defeated a 1900-rated player with a stunning queen sacrifice that led to a forced checkmate in 12 moves. The game has already been viewed over 5,000 times on ReplayChess.

### The Longest Game
At 97 moves, the Round 5 encounter between two 1600-rated players in the U1800 section was a marathon. The game featured two rook endgames, a fortress attempt, and a dramatic breakthrough on move 89.

## What's Next

Our Spring Blitz Championship is scheduled for March 2026. Registration opens February 15th. We're also introducing a new team format — stay tuned for details!`,
  },
  {
    slug: "understanding-pawn-structures",
    title: "Understanding Pawn Structures",
    excerpt:
      "The pawn skeleton defines the character of the position. Learn to read and manipulate pawn structures like a grandmaster.",
    category: "Strategy",
    date: "Jan 3, 2026",
    readTime: "6 min read",
    content: `Pawns are the soul of chess — a famous observation attributed to Philidor that remains as true today as it was in the 18th century. Understanding pawn structures is essential for making good strategic decisions.

## The Key Structures

### The Isolated Queen's Pawn (IQP)
A pawn on d4 (or d5) with no neighboring pawns on the c or e files. The IQP gives the side that has it active piece play and central control, but can become a weakness in the endgame.

### The Carlsbad Structure
Arising from the Exchange Queen's Gambit and similar openings, this structure features a white pawn chain from c3 to e3 against black pawns on c6 to e6. White typically plays for a queenside minority attack.

### The French Structure
White pawns on d4 and e5 against black pawns on d5 and e6. This locked center creates distinct plans for both sides — White attacks on the kingside while Black undermines the center with ...c5 and ...f6.

## How to Study

The best way to learn pawn structures is to study games played by strong players in your favorite openings. Notice how the pawn structure dictates piece placement, plans, and even the character of the endgame.`,
  },
  {
    slug: "new-feature-voice-guided-analysis",
    title: "New Feature: Voice-Guided Analysis",
    excerpt:
      "Our AI coach can now walk you through your games with voice narration, explaining key moments and missed opportunities.",
    category: "Updates",
    date: "Dec 28, 2025",
    readTime: "3 min read",
    content: `We're excited to introduce Voice-Guided Analysis — a brand new way to review your games. Our AI coach now narrates your game review, explaining key moments, critical mistakes, and missed opportunities in natural language.

## How It Works

After completing a game, click the "Voice Analysis" button in the review screen. Our AI will walk you through the game move by move, highlighting:

- **Critical moments** where the evaluation shifted significantly
- **Missed tactics** that could have changed the outcome
- **Positional insights** about pawn structures and piece placement
- **Endgame technique** improvements for the final phase

## Customizable Depth

Choose from three analysis levels:
1. **Quick Review** — 2-minute overview of the most important moments
2. **Standard** — Full game walkthrough with explanations
3. **Deep Dive** — Comprehensive analysis with alternative lines and variations

## Availability

Voice-Guided Analysis is available now for all Basic and Creator plan subscribers. Free users can access one voice review per week.`,
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

// First post is always featured — safe non-null assertion
export const featuredPost: BlogPost = blogPosts.find((post) => post.featured) ?? blogPosts[0]!;
