export type GameThemeId = "hub" | "nba-2k26" | "valorant" | "stocks";

export const GAME_THEMES: Record<
  GameThemeId,
  {
    label: string;
    buttonPrimary: string;
    buttonSecondary: string;
  }
> = {
  hub: {
    label: "BurgBuild",
    buttonPrimary:
      "bg-primary text-primary-foreground hover:opacity-90 transition-opacity",
    buttonSecondary:
      "border border-border bg-card text-foreground hover:bg-accent transition-colors",
  },
  "nba-2k26": {
    label: "NBA 2K26",
    buttonPrimary:
      "bg-primary text-primary-foreground hover:opacity-90 transition-opacity",
    buttonSecondary:
      "border border-border bg-card text-secondary-foreground hover:bg-secondary/30 transition-colors",
  },
  valorant: {
    label: "Valorant",
    buttonPrimary:
      "bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity",
    buttonSecondary:
      "border border-border bg-card text-foreground hover:bg-accent transition-colors",
  },
  stocks: {
    label: "Markets",
    buttonPrimary:
      "bg-primary text-primary-foreground hover:opacity-90 transition-opacity",
    buttonSecondary:
      "border border-border bg-card text-foreground hover:bg-accent transition-colors",
  },
};

export function getGameThemeForPath(pathname: string): GameThemeId {
  if (
    pathname.startsWith("/build") ||
    pathname.startsWith("/results") ||
    pathname.startsWith("/calibrate")
  ) {
    return "nba-2k26";
  }

  if (pathname.startsWith("/valorant")) {
    return "valorant";
  }

  if (pathname.startsWith("/stocks")) {
    return "stocks";
  }

  return "hub";
}
