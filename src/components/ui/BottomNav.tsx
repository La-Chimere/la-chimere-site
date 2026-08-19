"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AdminIcon,
  CommunitiesIcon,
  LeaderboardIcon,
  ProgrammeIcon,
} from "@/components/ui/icons";

interface BottomNavProps {
  isAdmin: boolean;
}

interface NavItem {
  page: string;
  label: string;
  Icon: () => React.JSX.Element;
  adminOnly?: boolean;
}

const ITEMS: NavItem[] = [
  { page: "programme", label: "Programme", Icon: ProgrammeIcon },
  { page: "leaderboard", label: "Leaderboard", Icon: LeaderboardIcon },
  { page: "communities", label: "Communautés", Icon: CommunitiesIcon },
  { page: "admin", label: "Admin", Icon: AdminIcon, adminOnly: true },
];

// Nav ancrée en bas de l'écran, cf. CDC 12.2 : 4 entrées (Programme /
// Leaderboard / Communautés / Admin), "Admin" visible seulement pour les
// administrateurs.
export function BottomNav({ isAdmin }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ page, label, Icon, adminOnly }) => {
        if (adminOnly && !isAdmin) return null;
        const active = pathname?.startsWith(`/${page}`);
        return (
          <Link
            key={page}
            href={`/${page}`}
            className={`bn-btn ${active ? "active" : ""}`}
          >
            <Icon />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
