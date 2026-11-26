"use client";

import styles from "./DashboardContent.module.css"
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { modalLoading } from "@/shared/components/deferredLoading/DeferredLoading";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import type { TeamOrder, UserOrder } from '@/lib/orders/server/orders.service';
import ServiceOrders from '../serviceOrders/ServiceOrders';
import { MemberFilter } from '../memberFilter/MemberFilter';
import type { GroupDetails, UserGroupInvitation } from "@/lib/groups/server/groups.service";
import { GroupInvitations } from "../groupInvitations/GroupInvitations";
import { useRouter } from "next/navigation";
import { formatPersonName, getPersonInitials } from "@/shared/utils/personName";

import { Session } from "next-auth";

const UpdateProfile = dynamic(() => import("../updateProfile/UpdateProfile"), { loading: modalLoading });
const UpdateGroup = dynamic(() => import("../updateGroup/UpdateGroup"), { loading: modalLoading });
const CreateGroupDialog = dynamic(
  () => import("../createGroupDialog/CreateGroupDialog").then((m) => m.CreateGroupDialog),
  { loading: modalLoading },
);

interface Props {
  user: Session["user"];
  orders: UserOrder[];
  group: GroupDetails | null;
  teamOrders: TeamOrder[];
  invitations: UserGroupInvitation[];
}

export function DashboardContent({ user, orders, group, teamOrders, invitations }: Props) {
  const router = useRouter();
  const t = useTranslations("dashboard");
  const { update } = useSession();

  const sessionUser = user;
  const fullName = formatPersonName(sessionUser?.firstName, sessionUser?.lastName);
  const initials = getPersonInitials(sessionUser?.firstName, sessionUser?.lastName);
  const needsGroup = sessionUser?.role === "groupAdmin" && !sessionUser.groupName;

  const [updateProfileOpen, setUpdateProfileOpen] = useState<boolean>(false);
  const [updateGroupOpen, setUpdateGroupOpen] = useState<boolean>(false);
  const canManageGroup = sessionUser?.role === "groupAdmin" && group !== null;

  // Membres ayant rejoint le groupe (les invitations en attente ne comptent pas)
  const teamMembers = useMemo(
    () => group?.users.filter((u) => u.role === "user" && u.groupStatus === "JOINED") ?? [],
    [group],
  );
  const memberCount = teamMembers.length;

  const [memberFilter, setMemberFilter] = useState<string>("");
  // Si le membre sélectionné a été retiré du groupe, on revient à « Tous »
  const activeMemberId = teamMembers.some((m) => m.id === memberFilter) ? memberFilter : "";
  const filteredTeamOrders = useMemo(
    () => (activeMemberId ? teamOrders.filter((o) => o.user?.id === activeMemberId) : teamOrders),
    [teamOrders, activeMemberId],
  );

  // Même carte pour l'utilisateur et le groupAdmin
  const profileCard = (
    <div className={styles.card} onClick={() => setUpdateProfileOpen(true)}>
      <div className={styles.qcardIcon}>👤</div>
      <div>
        <p className={styles.qcardTitle}>{t('myProfile')}</p>
        <p className={styles.qcardValue} style={{ fontSize: '13px' }}>
          {fullName}
        </p>
        <p className={styles.qcardDesc}>{sessionUser?.email}</p>
      </div>
      <span className={styles.qcardLink}>{t('editAccount')}</span>
    </div>
  );

  return (
    <div className={styles.mainContainer}>

      {sessionUser?.role === 'groupAdmin' && sessionUser.groupName && (
        <div className={styles.groupStateJoined}>{t('groupAdminBanner', { group: sessionUser.groupName })}</div>
      )}

      {sessionUser?.groupStatus === 'PENDING' && sessionUser?.role === 'user' && invitations.length === 0 && (
        <div className={styles.groupStatePending}>{t('pendingBanner')}</div>
      )}

      <GroupInvitations invitations={invitations} />

      {sessionUser?.groupStatus === 'JOINED' && sessionUser?.role === 'user' && (
        <div className={styles.groupStateJoined}>{t('joinedBanner', { group: sessionUser?.groupName ?? '' })}</div>
      )}

      <div className={styles.welcome}>
        <div className={styles.welcomeAvatar}>
          {initials}
        </div>
        <div>
          <p className={styles.welcomeTitle}>
            {t('greeting', { name: fullName })}
          </p>
          <p className={styles.welcomeSub}>
            {t('welcome')}
          </p>
        </div>
      </div>

      {sessionUser?.role === 'user' && (
        <div className={styles.userData}>
          {profileCard}
        </div>
      )}

      {sessionUser?.role === 'groupAdmin' && (
        <div className={styles.groupAdminData}>
          {profileCard}

          {canManageGroup && (
            <div className={`${styles.card} ${memberCount === 0 ? styles.groupEmpty : ""}`} onClick={() => setUpdateGroupOpen(true)}>
              <div className={styles.qcardIcon}>👤</div>
              <div>
                <p className={styles.qcardTitle}>{t('groupInfo')}</p>
                <p className={styles.qcardValue} style={{ fontSize: '1rem' }}>
                  {sessionUser?.groupName}
                  <br />
                  <br />
                  <span>{t('addMemberWarning')}</span>
                </p>
              </div>
              <span className={styles.qcardLink}>{t('editGroup')}</span>
            </div>
          )}
        </div>
      )}

      <ServiceOrders orders={orders} title={canManageGroup ? t('myServiceRequests') : t('serviceRequests')} />

      {canManageGroup && (
        <ServiceOrders
          orders={filteredTeamOrders}
          title={t('teamServiceRequests')}
          toolbar={
            teamMembers.length > 0 && (
              <MemberFilter members={teamMembers} value={activeMemberId} onChange={setMemberFilter} />
            )
          }
        />
      )}

      {updateProfileOpen && (
        <UpdateProfile
          sessionUser={sessionUser}
          onClose={() => setUpdateProfileOpen(false)}
        />
      )}

      {updateGroupOpen && group && (
        <UpdateGroup initialGroup={group} onClose={() => setUpdateGroupOpen(false)} />
      )}

      {needsGroup && (
        <CreateGroupDialog
          onCreated={async () => {
            await update();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}