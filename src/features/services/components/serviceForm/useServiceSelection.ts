import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAddressStore, type ServiceDraft, type ServiceKey } from '@/features/services/store/addressStore';
import type { Address } from '@/features/services/types/address';

/**
 * Services cochés d'une adresse, avec enregistrement automatique.
 * Partagé par le résidentiel (AddressServices) et le grand format (LargeAddressServices).
 */
export function useServiceSelection<K extends ServiceKey>(
  address: Address,
  types: readonly K[],
  /** Ajout au panier refusé : demande aux formulaires d'afficher leurs erreurs */
  showErrors: () => void,
) {
  const t = useTranslations('services');
  const drafts = useAddressStore((s) => s.drafts[address.id]);
  const setDraft = useAddressStore((s) => s.setDraft);
  const clearDraft = useAddressStore((s) => s.clearDraft);
  const removeService = useAddressStore((s) => s.removeServiceFromAddress);
  const validationRequest = useAddressStore((s) => s.validationRequest);
  const clearValidationRequest = useAddressStore((s) => s.clearValidationRequest);

  const savedId = (type: K) => address.services.find((s) => s.type === type)?.id;
  /** Présent : enregistré, ou en cours de saisie */
  const isPresent = (type: K) => Boolean(savedId(type) || drafts?.[type]);

  const [selected, setSelected] = useState<K[]>(() => types.filter(isPresent));

  // Service retiré ailleurs (ex. depuis le résumé) : on le décoche, pendant le rendu
  const present = types.filter(isPresent);
  const presentKey = present.join(',');
  const [prevPresentKey, setPrevPresentKey] = useState(presentKey);
  if (prevPresentKey !== presentKey) {
    const before = prevPresentKey.split(',');
    const gone = types.filter((type) => before.includes(type) && !present.includes(type));
    setPrevPresentKey(presentKey);
    if (gone.length > 0) setSelected((s) => s.filter((type) => !gone.includes(type)));
  }

  /** Décocher un service rempli le supprime, après confirmation */
  const handleServicesChange = (next: K[]) => {
    const removing = selected.filter((type) => !next.includes(type) && isPresent(type));
    for (const type of removing) {
      const key: ServiceKey = type;
      if (!window.confirm(t('serviceForm.confirmRemoveService', { service: t(`serviceTypes.${key}`) }))) return;
    }
    for (const type of removing) {
      const id = savedId(type);
      if (id) removeService(address.id, id);
      clearDraft(address.id, type);
    }
    setSelected(next);
  };

  /** Mémorise la saisie d'un service (complète ou non) */
  const recordDraft = <T extends K>(type: T, values: ServiceDraft<T>['values'], complete: boolean) =>
    setDraft(address.id, type, { values, complete });

  // Demande d'affichage des erreurs (ajout au panier refusé), traitée une seule fois
  const showErrorsRef = useRef(showErrors);
  useEffect(() => {
    showErrorsRef.current = showErrors;
  });
  useEffect(() => {
    if (validationRequest === 0) return;
    showErrorsRef.current();
    clearValidationRequest();
  }, [validationRequest, clearValidationRequest]);

  return { selected, handleServicesChange, recordDraft, drafts };
}
