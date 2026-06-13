import type { BuildProfile } from "@/lib/types/build";

export interface Database {
  public: {
    Tables: {
      builds: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          profile: BuildProfile;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          profile: BuildProfile;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          profile?: BuildProfile;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type SavedBuildRow = Database["public"]["Tables"]["builds"]["Row"];

export interface SavedBuildSummary {
  id: string;
  name: string;
  position: BuildProfile["position"];
  updatedAt: string;
}
