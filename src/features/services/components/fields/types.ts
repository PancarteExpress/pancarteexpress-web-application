export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  /** Affiché coché + désactivé, indépendamment de la valeur (ex. ancrages inclus avec pancartes) */
  locked?: boolean;
}

export type Columns = 1 | 2 | 3 | 4;

/** Compatible avec le `field.ref` de React Hook Form */
export type ElementRef<T extends HTMLElement> = (element: T | null) => void;

export function toOptions<T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): ChoiceOption<T>[] {
  return values.map((value) => ({ value, label: labels[value] }));
}