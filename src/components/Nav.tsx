"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavAuth } from "@/components/auth/NavAuth";
import {
  GAME_THEMES,
  getGameThemeForPath,
} from "@/lib/constants/game-themes";

const nba2k26Links = [
  { href: "/build", label: "Build" },
  { href: "/results", label: "Results" },
  { href: "/builds", label: "My Builds" },
  { href: "/calibrate", label: "Calibrate" },
];

const valorantLinks = [{ href: "/valorant/lineups", label: "Lineups" }];

const stocksLinks = [
  { href: "/stocks/buy-timing", label: "Buy Timing" },
  { href: "/stocks/watchlist", label: "Watchlist" },
];

function isNba2k26Route(pathname: string) {
  return (
    nba2k26Links.some((link) => pathname.startsWith(link.href)) ||
    pathname.startsWith("/auth")
  );
}

function isValorantRoute(pathname: string) {
  return pathname.startsWith("/valorant");
}

function isStocksRoute(pathname: string) {
  return pathname.startsWith("/stocks");
}

export function Nav() {
  const pathname = usePathname();
  const inNba2k26 = isNba2k26Route(pathname);
  const inValorant = isValorantRoute(pathname);
  const inStocks = isStocksRoute(pathname);
  const themeId = getGameThemeForPath(pathname);
  const theme = GAME_THEMES[themeId];

  const linkClass = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)
      ? "font-semibold text-foreground"
      : "text-muted-foreground hover:text-foreground";

  return (
    <nav className="border-b border-sidebar-border bg-sidebar">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4 py-2">
        <Link
          href="/"
          className="text-sm font-bold uppercase tracking-wider text-primary"
        >
          BurgBuild
        </Link>

        {inNba2k26 && (
          <>
            <span className="text-xs uppercase tracking-wide text-muted-foreground/50">
              /
            </span>
            <span className="text-xs uppercase tracking-wide text-secondary-foreground">
              {theme.label}
            </span>
            {nba2k26Links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs uppercase tracking-wide transition-colors ${linkClass(link.href)}`}
              >
                {link.label}
              </Link>
            ))}
          </>
        )}

        {inValorant && (
          <>
            <span className="text-xs uppercase tracking-wide text-muted-foreground/50">
              /
            </span>
            <span className="text-xs uppercase tracking-wide text-destructive">
              {theme.label}
            </span>
            {valorantLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs uppercase tracking-wide transition-colors ${linkClass(link.href)}`}
              >
                {link.label}
              </Link>
            ))}
          </>
        )}

        {inStocks && (
          <>
            <span className="text-xs uppercase tracking-wide text-muted-foreground/50">
              /
            </span>
            <span className="text-xs uppercase tracking-wide text-primary">
              {theme.label}
            </span>
            {stocksLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs uppercase tracking-wide transition-colors ${linkClass(link.href)}`}
              >
                {link.label}
              </Link>
            ))}
          </>
        )}

        <NavAuth />
      </div>
    </nav>
  );
}
