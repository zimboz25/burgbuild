"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  createUserBuild,
  deleteUserBuild,
  getUserBuild,
  listUserBuilds,
} from "@/lib/supabase/builds";
import type { SavedBuildSummary } from "@/lib/supabase/database.types";
import { useBuildStore } from "@/lib/store/build-store";

export default function BuildsPage() {
  const router = useRouter();
  const { configured, loading, user } = useAuth();
  const loadBuild = useBuildStore((s) => s.loadBuild);
  const startNewBuild = useBuildStore((s) => s.startNewBuild);
  const currentCloudId = useBuildStore((s) => s.cloudBuildId);
  const currentBuild = useBuildStore((s) => s.build);

  const [builds, setBuilds] = useState<SavedBuildSummary[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const rows = await listUserBuilds();
      setBuilds(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load builds");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth?next=/builds");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      void refresh();
    }
  }, [user, refresh]);

  async function handleLoad(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const row = await getUserBuild(id);
      if (!row) throw new Error("Build not found");
      loadBuild(row.profile, row.id);
      router.push("/build");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load build");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateNew() {
    setBusyId("new");
    setError(null);
    try {
      const created = await createUserBuild(currentBuild);
      loadBuild(created.profile, created.id);
      await refresh();
      router.push("/build");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create build");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveCurrent() {
    if (currentCloudId) {
      router.push("/build");
      return;
    }
    await handleCreateNew();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this build? This cannot be undone.")) return;
    setBusyId(id);
    setError(null);
    try {
      await deleteUserBuild(id);
      if (currentCloudId === id) {
        startNewBuild();
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete build");
    } finally {
      setBusyId(null);
    }
  }

  if (!configured) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-muted">Supabase is not configured.</p>
      </main>
    );
  }

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-muted">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My Builds</h1>
          <p className="mt-1 text-sm text-muted">
            Signed in as {user.email}. Builds auto-save while you edit.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              startNewBuild();
              router.push("/build");
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-card"
          >
            New Local Build
          </button>
          <button
            type="button"
            onClick={() => void handleCreateNew()}
            disabled={busyId === "new"}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
          >
            Save Current to Cloud
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {!currentCloudId && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Your current build is only on this device.{" "}
          <button
            type="button"
            onClick={() => void handleSaveCurrent()}
            className="font-medium underline"
          >
            Save it to the cloud
          </button>{" "}
          to sync across devices.
        </div>
      )}

      {fetching ? (
        <p className="text-muted">Loading builds…</p>
      ) : builds.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="mb-4 text-muted">No saved builds yet.</p>
          <button
            type="button"
            onClick={() => void handleCreateNew()}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Save Current Build
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {builds.map((item) => {
            const isActive = item.id === currentCloudId;
            const updated = new Date(item.updatedAt).toLocaleString();
            return (
              <li
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-4 ${
                  isActive
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-border bg-card"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium">{item.name}</h2>
                    {isActive && (
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {item.position} · Updated {updated}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleLoad(item.id)}
                    disabled={busyId === item.id}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-background disabled:opacity-60"
                  >
                    {busyId === item.id ? "Loading…" : "Open"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id)}
                    disabled={busyId === item.id}
                    className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 flex gap-4 text-sm">
        <Link href="/build" className="text-muted hover:text-foreground">
          ← Back to builder
        </Link>
      </div>
    </main>
  );
}
