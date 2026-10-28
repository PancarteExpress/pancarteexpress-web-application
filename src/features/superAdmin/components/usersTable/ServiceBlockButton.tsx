'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setServiceBlockAction } from '@/lib/users/server/serviceBlock.actions';
import { SERVICE_BLOCK_GRACE_DAYS } from '@/lib/orders/billing';

interface ServiceBlockButtonProps {
  userId: string;
  userName: string;
  isBlocked: boolean;
  /** Raison pour laquelle le blocage est impossible ; désactive le bouton */
  disabledReason?: string;
  className?: string;
  noteClassName?: string;
}

export function ServiceBlockButton({
  userId,
  userName,
  isBlocked,
  disabledReason,
  className,
  noteClassName,
}: ServiceBlockButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    const question = isBlocked
      ? `Débloquer ${userName} ? Les demandes de service seront de nouveau possibles immédiatement.`
      : `Bloquer ${userName} ? Ses demandes de service seront refusées dans ${SERVICE_BLOCK_GRACE_DAYS} jours.`;
    if (!window.confirm(question)) return;

    setError(null);
    startTransition(async () => {
      const result = await setServiceBlockAction(userId, !isBlocked);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={handleClick}
        disabled={isPending || disabledReason !== undefined}
        title={disabledReason}
      >
        {isPending ? '…' : isBlocked ? 'Débloquer' : 'Bloquer'}
      </button>
      {/* Visible aussi au toucher et pour les lecteurs d'écran, contrairement à l'infobulle seule */}
      {disabledReason && <span className={noteClassName}>{disabledReason}</span>}
      {error && (
        <span className={noteClassName} role="alert">
          {error}
        </span>
      )}
    </>
  );
}