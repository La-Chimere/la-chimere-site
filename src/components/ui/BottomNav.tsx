"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AdminIcon,
  CommunitiesIcon,
  LeaderboardIcon,
  ProgrammeIcon,
} from "@/components/ui/icons";
import { useT } from "@/components/i18n/LocaleProvider";

interface BottomNavProps {
  isAdmin: boolean;
}

interface NavItem {
  page: string;
  labelKey: string;
  Icon: () => React.JSX.Element;
  adminOnly?: boolean;
}

const ITEMS: NavItem[] = [
  { page: "programme", labelKey: "nav.programme", Icon: ProgrammeIcon },
  { page: "leaderboard", labelKey: "nav.leaderboard", Icon: LeaderboardIcon },
  { page: "communities", labelKey: "nav.communities", Icon: CommunitiesIcon },
  { page: "admin", labelKey: "nav.admin", Icon: AdminIcon, adminOnly: true },
];

// Nav ancrée en bas de l'écran, cf. CDC 12.2 : 4 entrées (Programme /
// Leaderboard / Communautés / Admin), "Admin" visible seulement pour les
// administrateurs.
export function BottomNav({ isAdmin }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useT();

  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ page, labelKey, Icon, adminOnly }) => {
        if (adminOnly && !isAdmin) return null;
        const active = pathname?.startsWith(`/${page}`);
        return (
          <Link
            key={page}
            href={`/${page}`}
            className={`bn-btn ${active ? "active" : ""}`}
          >
            <Icon />
            <span>{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
