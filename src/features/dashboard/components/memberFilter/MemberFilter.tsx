'use client';

import type { GroupMember } from '@/lib/groups/server/groups.service';
import { getDisplayName } from '@/shared/utils/displayName';
import styles from './MemberFilter.module.css';

interface Props {
  members: GroupMember[];
  /** '' = tous les membres */
  value: string;
  onChange: (memberId: string) => void;
}

export function MemberFilter({ members, value, onChange }: Props) {
  return (
    <label className={styles.filter}>
      <span>Membre</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Tous les membres</option>
        {members.map((m) => {
          const name = getDisplayName(m);
          return (
            <option key={m.id} value={m.id}>
              {name === m.email ? name : `${name} · ${m.email}`}
            </option>
          );
        })}
      </select>
    </label>
  );
}