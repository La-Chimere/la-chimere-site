export interface CommunityMember {
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  hasKey: boolean;
  communityIds: string[];
}

export interface UpcomingCommunityEvent {
  id: string;
  title: string | null;
  eventDate: string;
  startTime: string;
  communityIds: string[];
  communityLabels: string[];
}

export interface ParticipationRecord {
  profileId: string;
  eventDate: string;
  communityIds: string[];
}
