import { AdminKeysBlock } from "@/components/admin/AdminKeysBlock";
import { AdminMembersBlock } from "@/components/admin/AdminMembersBlock";
import { AdminCommunitiesBlock } from "@/components/admin/AdminCommunitiesBlock";
import type { AdminCommunity, AdminMember, ClubSettings } from "@/lib/admin-types";

interface AdminClientProps {
  members: AdminMember[];
  keyHolders: AdminMember[];
  communities: AdminCommunity[];
  settings: ClubSettings;
  activeMembersThisMonth: number;
  totalMembers: number;
}

// Page Admin (CDC 12.9) : 3 blocs dans cet ordre — Clés, Membres, Communautés.
export function AdminClient({
  members,
  keyHolders,
  communities,
  settings,
  activeMembersThisMonth,
  totalMembers,
}: AdminClientProps) {
  return (
    <div className="page">
      <AdminKeysBlock members={keyHolders} settings={settings} />
      <AdminMembersBlock
        members={members}
        activeThisMonth={activeMembersThisMonth}
        totalMembers={totalMembers}
      />
      <AdminCommunitiesBlock communities={communities} />
    </div>
  );
}
