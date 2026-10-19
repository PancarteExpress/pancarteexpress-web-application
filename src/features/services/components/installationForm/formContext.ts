import { useCallback } from 'react';
import { useFormContext, useFormState, useWatch, type ControllerFieldState, type ControllerRenderProps, type FieldPath, type PathValue, } from 'react-hook-form';
import type { InstallationFormValues } from '../../schemas/installation.schema';
import type { InstallationDetails } from '../../types/installation';

export type InstallationPath = FieldPath<InstallationFormValues>;
export type FrameUnitPath = `frames.units.${number}`;

export const useInstallationFormContext = () =>
  useFormContext<InstallationFormValues, unknown, InstallationDetails>();

/** setValue typé : marque le champ modifié, revalide seulement après la 1re soumission. */
export function useFormUpdater() {
  const { control, setValue } = useInstallationFormContext();
  const { isSubmitted } = useFormState({ control });

  return useCallback(
    <TName extends InstallationPath>(name: TName, value: PathValue<InstallationFormValues, TName>) => {
      setValue(name, value, { shouldDirty: true, shouldValidate: isSubmitted });
    },
    [setValue, isSubmitted],
  );
}

/** Adapte un Controller aux props contrôlées des primitives (value, onChange, error…). */
export function bindField<TName extends InstallationPath>({
  field,
  fieldState,
}: {
  field: ControllerRenderProps<InstallationFormValues, TName>;
  fieldState: ControllerFieldState;
}) {
  return {
    value: field.value,
    onChange: field.onChange,
    onBlur: field.onBlur,
    inputRef: field.ref,
    error: fieldState.error?.message,
  };
}

/** uid des pancartes de la demande, dans l'ordre ; vide si Pancartes n'est pas coché */
export function useFrameUids(): string[] {
  const { control } = useInstallationFormContext();
  const materials = useWatch({ control, name: 'materials' });
  const units = useWatch({ control, name: 'frames.units' });
  return materials.includes('frames') ? units.map((u) => u.uid) : [];
}