import { useImperativeHandle, type Ref } from 'react';
import type { FieldValues, UseFormHandleSubmit } from 'react-hook-form';

/** Poignée exposée par un formulaire de service à son parent */
export interface ServiceFormHandle<TDetails> {
  /** Valide le formulaire et affiche ses erreurs ; renvoie les données ou null si invalide */
  submit: () => Promise<TDetails | null>;
}

/** Expose `submit()` au parent : valide, affiche les erreurs, renvoie les données ou null */
export function useServiceFormHandle<TValues extends FieldValues, TDetails>(
  handle: Ref<ServiceFormHandle<TDetails>>,
  handleSubmit: UseFormHandleSubmit<TValues, TDetails>,
) {
  useImperativeHandle(handle, () => ({
    submit: () =>
      new Promise<TDetails | null>((resolve) => {
        void handleSubmit((details) => resolve(details), () => resolve(null))();
      }),
  }), [handleSubmit]);
}
