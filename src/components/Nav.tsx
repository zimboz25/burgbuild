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

function isNba2k26Route(pathname: string) {
  return (
    nba2k26Links.some((link) => pathname.startsWith(link.href)) ||
    pathname.startsWith("/auth")
  );
}

function isValorantRoute(pathname: string) {
  return pathname.startsWith("/valorant");
}

export function Nav() {
  const pathname = usePathname();
  const inNba2k26 = isNba2k26Route(pathname);
  const inValorant = isValorantRoute(pathname);
  const themeId = getGameThemeForPath(pathname);
  const theme = GAME_THEMES[themeId];

  return (
    <nav
      className="border-b"
      style={{
        backgroundColor: theme.navBg,
        borderColor: theme.navBorder,
      }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4 py-2">
        <Link
          href="/"
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: theme.navBrand }}
        >
          BurgBuild
        </Link>

        {inNba2k26 && (
          <>
            <span className="text-xs uppercase tracking-wide text-white/30">
              /
            </span>
            <span
              className="text-xs uppercase tracking-wide"
              style={{ color: theme.accentMuted }}
            >
              NBA 2K26
            </span>
            {nba2k26Links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs uppercase tracking-wide ${
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "font-semibold text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </>
        )}

        {inValorant && (
          <>
            <span className="text-xs uppercase tracking-wide text-white/30">
              /
            </span>
            <span className="text-xs uppercase tracking-wide text-[#ff4655]">
              Valorant
            </span>
            {valorantLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs uppercase tracking-wide ${
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "font-semibold text-white"
                    : "text-white/50 hover:text-white"
                }`}
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
