"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { BuildCloudSync } from "@/components/auth/BuildCloudSync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BuildCloudSync />
      {children}
    </AuthProvider>
  );
}
