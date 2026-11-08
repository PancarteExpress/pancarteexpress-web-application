"use client";

interface FilterSelectProps<T extends string> {
  value: T | null;
  options: readonly T[];
  // NoInfer : T vient des options, pas de labels (ROLE_LABELS contient aussi superAdmin)
  labels: Record<NoInfer<T>, string>;
  allLabel: string;
  ariaLabel: string;
  onChange: (value: T | null) => void;
  className?: string;
}

export function FilterSelect<T extends string>({
  value, options, labels, allLabel, ariaLabel, onChange, className,
}: FilterSelectProps<T>) {
  return (
    <select
      className={className}
      aria-label={ariaLabel}
      value={value ?? ""}
      // find() convertit la string en T typé, sans cast
      onChange={(e) => onChange(options.find((o) => o === e.target.value) ?? null)}
    >
      <option value="">{allLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {labels[option]}
        </option>
      ))}
    </select>
  );
}