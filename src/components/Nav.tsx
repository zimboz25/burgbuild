"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/build", label: "Build" },
  { href: "/results", label: "Results" },
  { href: "/calibrate", label: "Calibrate" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-red-900/40 bg-[#0d0808]">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4 py-2">
        <Link href="/" className="text-sm font-bold uppercase tracking-wider text-red-400">
          2K26 Build Planner
        </Link>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-xs uppercase tracking-wide ${
              pathname === link.href
                ? "text-white font-semibold"
                : "text-white/50 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
