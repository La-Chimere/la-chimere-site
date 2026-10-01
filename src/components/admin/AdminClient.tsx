import { AdminKeysBlock } from "@/components/admin/AdminKeysBlock";
import { AdminMembersBlock } from "@/components/admin/AdminMembersBlock";
import { AdminCommunitiesBlock } from "@/components/admin/AdminCommunitiesBlock";
import { AdminLeaguesBlock } from "@/components/admin/AdminLeaguesBlock";
import type { PickableMember } from "@/components/ui/MemberPicker";
import type { AdminCommunity, AdminMember, ClubSettings } from "@/lib/admin-types";

interface AdminClientProps {
  members: AdminMember[];
  keyHolders: AdminMember[];
  communities: AdminCommunity[];
  settings: ClubSettings;
  activeMembersThisMonth: number;
  totalMembers: number;
  leagueOrganizers: PickableMember[];
  nonLeagueOrganizers: PickableMember[];
}

// Page Admin (CDC 12.9) : 4 blocs dans cet ordre — Clés, Membres, Communautés, Ligues.
export function AdminClient({
  members,
  keyHolders,
  communities,
  settings,
  activeMembersThisMonth,
  totalMembers,
  leagueOrganizers,
  nonLeagueOrganizers,
}: AdminClientProps) {
  return (
    <div className="page">
      <AdminKeysBlock members={keyHolders} settings={settings} />
      <AdminMembersBlock
        members={members}
        activeThisMonth={activeMembersThisMonth}
        totalMembers={totalMembers}
        requireSignupValidation={settings.requireSignupValidation}
      />
      <AdminCommunitiesBlock communities={communities} />
      <AdminLeaguesBlock organizers={leagueOrganizers} nonOrganizers={nonLeagueOrganizers} />
    </div>
  );
}
