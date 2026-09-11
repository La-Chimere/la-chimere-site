export interface CommunityMember {
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  hasKey: boolean;
  communityIds: string[];
}

export interface ParticipationRecord {
  profileId: string;
  eventDate: string;
  communityIds: string[];
}
