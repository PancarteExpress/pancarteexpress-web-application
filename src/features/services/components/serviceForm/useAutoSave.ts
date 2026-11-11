import { useEffect, useRef } from 'react';
import type { FieldValues, UseFormGetValues, UseFormWatch } from 'react-hook-form';
import type * as z from 'zod';

/** values : la saisie (brouillon) ; details : les données validées, ou null si la saisie est incomplète */
export type AutoSaveHandler<TValues, TDetails> = (values: TValues, details: TDetails | null) => void;

/**
 * Enregistrement automatique : au montage puis à chaque modification, le formulaire est validé
 * en silence (aucune erreur affichée) et le parent reçoit le brouillon et son éventuel résultat.
 * L'effet est justifié : il synchronise le formulaire avec un système externe (le store persisté).
 */
export function useAutoSave<TValues extends FieldValues, TDetails>(
  watch: UseFormWatch<TValues>,
  getValues: UseFormGetValues<TValues>,
  schema: z.ZodType<TDetails, TValues>,
  onChange: AutoSaveHandler<TValues, TDetails>,
) {
  // Dernier gestionnaire reçu, sans réabonner le formulaire à chaque rendu du parent
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const emit = () => {
      // Copie : le store ne doit jamais partager l'objet interne de React Hook Form
      const values = structuredClone(getValues());
      const result = schema.safeParse(values);
      onChangeRef.current(values, result.success ? result.data : null);
    };
    // Au montage : un service qu'on vient de cocher est aussitôt connu (complet ou non)
    emit();
    const subscription = watch(emit);
    return () => subscription.unsubscribe();
  }, [watch, getValues, schema]);
}
