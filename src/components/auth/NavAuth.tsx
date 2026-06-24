"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useBuildStore } from "@/lib/store/build-store";

export function NavAuth() {
  const pathname = usePathname();
  const { configured, loading, user, signOut } = useAuth();

  if (!configured) return null;

  if (loading) {
    return (
      <span className="ml-auto text-xs uppercase tracking-wide text-muted-foreground/60">
        …
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href={`/auth?next=${encodeURIComponent(pathname)}`}
        className="ml-auto text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="ml-auto flex items-center gap-4">
      <Link
        href="/builds"
        className="text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        My Builds
      </Link>
      <span className="hidden text-xs text-muted-foreground/70 sm:inline">
        {user.email}
      </span>
      <button
        type="button"
        onClick={() => {
          useBuildStore.getState().setCloudBuildId(null);
          useBuildStore.getState().setCloudSaveStatus("idle");
          void signOut();
        }}
        className="text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        Sign Out
      </button>
    </div>
  );
}
