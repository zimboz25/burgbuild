import type { GameSection } from "@/components/home/game-card";

export const homeGames: GameSection[] = [
  {
    id: "nba-2k26",
    title: "NBA 2K26",
    theme: "nba-2k26",
    tools: [
      {
        name: "build-planner",
        title: "NBA 2K26 Build Planner",
        description:
          "Input your MyPLAYER build and get auto-computed max potentials, badge eligibility, VC upgrade suggestions, and cap breaker optimization.",
        href: "/build",
        cta: "Start Building",
        secondaryCta: { label: "View Results", href: "/results" },
        features: [
          "Auto max potentials from height, weight, wingspan, and position",
          "43 badges with Bronze through Legend tier requirements",
          "VC optimizer ranked by badge impact per VC spent",
          "Cap breaker allocation plans with specialization constraints",
        ],
      },
    ],
  },
  {
    id: "valorant",
    title: "Valorant",
    theme: "valorant",
    tools: [
      {
        name: "lineups",
        title: "Lineup Library",
        description:
          "Pick a map, browse top-down lineup markers, and open stand position, aim reference, and utility details for each spot.",
        href: "/valorant/lineups",
        cta: "Browse Lineups",
        features: [
          "Map picker with top-down lineup markers",
          "Agent-specific icons for darts, mollies, and nades",
          "Stand and aim reference images with power levels",
          "Filter by site and attack/defense side",
        ],
      },
    ],
  },
  {
    id: "stocks",
    title: "Markets",
    theme: "stocks",
    tools: [
      {
        name: "buy-timing",
        title: "Buy Timing Scanner",
        description:
          "Scan ASX 200, S&P 500, and NASDAQ 100 with four trading bots and consensus scoring to surface stronger buy windows.",
        href: "/stocks/buy-timing",
        cta: "Open Scanner",
        features: [
          "ASX 200, S&P 500, and NASDAQ 100 market switcher",
          "Four trading bots with bullish consensus scoring",
          "RSI, SMA, MACD, and ML model signals",
          "Sector filters with ranked suggestions and detail panel",
        ],
      },
      {
        name: "watchlist",
        title: "Watchlist",
        description:
          "Save symbols to track price change since added and monitor bot consensus across technical, momentum, mean reversion, and ML models.",
        href: "/stocks/watchlist",
        cta: "Open Watchlist",
        features: [
          "Track symbols across ASX, S&P 500, and NASDAQ 100",
          "Price change since you added each symbol",
          "Per-stock bot breakdown and consensus badges",
          "Local save with optional cloud sync when signed in",
        ],
      },
    ],
  },
];
