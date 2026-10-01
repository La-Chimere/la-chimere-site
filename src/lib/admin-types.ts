export interface AdminMember {
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  status: "pending" | "active";
  hasKey: boolean;
  hasExitKey: boolean;
  lastActivity: string | null;
}

export interface AdminCommunity {
  id: string;
  key: string;
  label: string;
  hidden: boolean;
  competitive: boolean;
}

export interface ClubSettings {
  buildingCode: string | null;
  totalKeys: number;
  totalExitKeys: number;
  requireSignupValidation: boolean;
}
