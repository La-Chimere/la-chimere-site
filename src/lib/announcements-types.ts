export type PollType = "unique" | "multiple" | "rating";

export interface PollOption {
  id: string;
  label: string;
  voteCount: number;
}

export interface Poll {
  id: string;
  question: string;
  type: PollType;
  options: PollOption[];
  /** Options (ou note) choisies par le membre courant. */
  myOptionIds: string[];
  myRating: number | null;
  ratingCounts: Record<number, number>;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  targetCommunityId: string | null;
  targetCommunityLabel: string | null;
  announcementDate: string;
  banner: boolean;
  bannerText: string | null;
  createdBy: string | null;
  poll: Poll | null;
  seen: boolean;
}

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}
