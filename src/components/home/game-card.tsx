import Link from "next/link";
import type { GameThemeId } from "@/lib/constants/game-themes";
import { GAME_THEMES } from "@/lib/constants/game-themes";

export interface GameTool {
  name: string;
  title: string;
  description: string;
  href?: string;
  cta: string;
  secondaryCta?: { label: string; href: string };
  features: string[];
  comingSoon?: boolean;
}

export interface GameSection {
  id: string;
  title: string;
  theme: GameThemeId;
  tools: GameTool[];
}

interface GameCardProps {
  game: GameSection;
  tool: GameTool;
}

export function GameCard({ game, tool }: GameCardProps) {
  const theme = GAME_THEMES[game.theme];

  return (
    <article className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
        {game.title}
      </p>
      <h3 className="mb-2 text-2xl font-semibold text-foreground">
        {tool.title}
      </h3>
      <p className="mb-6 text-muted-foreground">{tool.description}</p>
      <div className="mb-6 flex flex-wrap gap-4">
        {tool.comingSoon || !tool.href ? (
          <span
            className={`cursor-not-allowed rounded-lg px-6 py-3 font-medium opacity-60 ${theme.buttonPrimary}`}
          >
            {tool.cta}
          </span>
        ) : (
          <Link
            href={tool.href}
            className={`rounded-lg px-6 py-3 font-medium ${theme.buttonPrimary}`}
          >
            {tool.cta}
          </Link>
        )}
        {tool.secondaryCta && (
          <Link
            href={tool.secondaryCta.href}
            className={`rounded-lg px-6 py-3 ${theme.buttonSecondary}`}
          >
            {tool.secondaryCta.label}
          </Link>
        )}
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {tool.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="text-primary">•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
