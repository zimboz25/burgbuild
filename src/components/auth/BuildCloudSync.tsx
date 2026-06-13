"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createUserBuild, updateUserBuild } from "@/lib/supabase/builds";
import { useBuildStore } from "@/lib/store/build-store";

const SAVE_DEBOUNCE_MS = 2000;

/** Auto-saves the active build to Supabase when the user is signed in. */
export function BuildCloudSync() {
  const { user } = useAuth();
  const build = useBuildStore((s) => s.build);
  const cloudBuildId = useBuildStore((s) => s.cloudBuildId);
  const setCloudBuildId = useBuildStore((s) => s.setCloudBuildId);
  const setCloudSaveStatus = useBuildStore((s) => s.setCloudSaveStatus);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buildRef = useRef(build);
  buildRef.current = build;

  useEffect(() => {
    if (!user) {
      setCloudSaveStatus("idle");
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      void (async () => {
        setCloudSaveStatus("saving");
        try {
          const profile = buildRef.current;
          if (cloudBuildId) {
            await updateUserBuild(cloudBuildId, profile);
          } else {
            const created = await createUserBuild(profile);
            setCloudBuildId(created.id);
          }
          setCloudSaveStatus("saved");
        } catch {
          setCloudSaveStatus("error");
        }
      })();
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, build, cloudBuildId, setCloudBuildId, setCloudSaveStatus]);

  return null;
}
