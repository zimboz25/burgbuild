"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useBuildStore } from "@/lib/store/build-store";

const labels = {
  idle: null,
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
} as const;

export function CloudSaveStatus() {
  const { user } = useAuth();
  const cloudSaveStatus = useBuildStore((s) => s.cloudSaveStatus);
  const cloudBuildId = useBuildStore((s) => s.cloudBuildId);

  if (!user || !cloudBuildId) return null;

  const label = labels[cloudSaveStatus];
  if (!label) return null;

  return (
    <span
      className={`text-[10px] uppercase tracking-wide ${
        cloudSaveStatus === "error" ? "text-red-400" : "text-emerald-400/80"
      }`}
    >
      {label}
    </span>
  );
}
