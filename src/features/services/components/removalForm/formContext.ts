import { useCallback } from 'react';
import {
  useFormContext, useFormState,
  type ControllerFieldState, type ControllerRenderProps, type FieldPath, type PathValue,
} from 'react-hook-form';
import type { RemovalFormValues } from '@/features/services/schemas/removal.schema';
import type { RemovalDetails } from '@/features/services/types/removal';

export type RemovalPath = FieldPath<RemovalFormValues>;

export const useRemovalFormContext = () => useFormContext<RemovalFormValues, unknown, RemovalDetails>();

/** setValue typé : marque le champ modifié, revalide seulement après la 1re soumission. */
export function useRemovalUpdater() {
  const { control, setValue } = useRemovalFormContext();
  const { isSubmitted } = useFormState({ control });

  return useCallback(
    <TName extends RemovalPath>(name: TName, value: PathValue<RemovalFormValues, TName>) => {
      setValue(name, value, { shouldDirty: true, shouldValidate: isSubmitted });
    },
    [setValue, isSubmitted],
  );
}

/** Adapte un Controller aux props contrôlées des primitives (value, onChange, error…). */
export function bindRemovalField<TName extends RemovalPath>({
  field,
  fieldState,
}: {
  field: ControllerRenderProps<RemovalFormValues, TName>;
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