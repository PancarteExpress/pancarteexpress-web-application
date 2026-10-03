"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ChangeEvent } from 'react';

import styles from "./AddressAutocomplete.module.css";
import { loadGoogleMaps } from "@/shared/utils/googleMapsLoader";
import { ParsedAddress } from "@/shared/types/address";
import { parsePlace } from '@/shared/utils/parsePlace';

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (address: ParsedAddress | null) => void;
  placeholder?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

interface Suggestion {
  placeId: string;
  label: string;
  prediction: google.maps.places.PlacePrediction;
}

const MIN_CHARS = 1;
const DEBOUNCE_MS = 250;

const QUEBEC_BOUNDS: google.maps.LatLngBoundsLiteral = {
  south: 44.72198,
  west: -79.843658,
  north: 62.718634,
  east: -57.607331,
};

const QC_REGEX = /\bQC\b/;
const POSTAL_CODE_REGEX = /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i;


function hasRequiredComponents(place: google.maps.places.Place): boolean {
  const get = (type: string) =>
    place.addressComponents?.find((c) => c.types.includes(type))?.longText ?? '';

  return (
    get('street_number') !== '' &&
    get('route') !== '' &&
    POSTAL_CODE_REGEX.test(get('postal_code'))
  );
}

// Convertit un Place (New) au format PlaceResult (legacy) attendu par parsePlace
function toPlaceResult(place: google.maps.places.Place): google.maps.places.PlaceResult {
  return {
    formatted_address: place.formattedAddress ?? undefined,
    address_components: place.addressComponents?.map((c) => ({
      long_name: c.longText ?? '',
      short_name: c.shortText ?? '',
      types: c.types,
    })),
  };
}

export default function AddressAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  placeholder = 'Commencez à taper votre adresse',
  disabled,
  ...aria
}: Props) {
  const listboxId = useId();
  const hasSelectionRef = useRef(false);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const onChangeRef = useRef(onChange);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onChangeRef.current = onChange;
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError("L'autocomplétion est indisponible. Vérifiez votre adresse manuellement.");
      });

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const closeSuggestions = () => {
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const fetchSuggestions = async (input: string) => {
    // Invalide les réponses des requêtes précédentes (frappe rapide)
    const requestId = ++requestIdRef.current;

    // Un token par session de saisie : les requêtes sont facturées comme une seule session
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }

    try {
      const { suggestions: results } =
        await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          includedRegionCodes: ['ca'],
          locationRestriction: QUEBEC_BOUNDS,
          includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
          language: 'fr',
          sessionToken: sessionTokenRef.current,
        });

      if (requestId !== requestIdRef.current) return;

      setSuggestions(
        results.flatMap((s) => {
          const p = s.placePrediction;
          // Exclut les débordements du rectangle 
          if (!p || !QC_REGEX.test(p.secondaryText?.text ?? '')) return [];
          return [{ placeId: p.placeId, label: p.text.text, prediction: p }];
        })
      );
      setActiveIndex(-1);
    } catch {
      if (requestId === requestIdRef.current) closeSuggestions();
    }
  };

  const selectSuggestion = async (suggestion: Suggestion) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    requestIdRef.current++;
    closeSuggestions();
    onChangeRef.current(suggestion.label);

    const place = suggestion.prediction.toPlace();
    try {
      // Limite les champs facturés par Google au strict nécessaire
      await place.fetchFields({ fields: ['addressComponents', 'formattedAddress'] });
    } catch {
      hasSelectionRef.current = false;
      onSelectRef.current?.(null);
      return;
    } finally {
      // fetchFields clôt la session : la prochaine saisie en démarre une nouvelle
      sessionTokenRef.current = null;
    }

    if (!hasRequiredComponents(place)) {
      hasSelectionRef.current = false;
      onSelectRef.current?.(null);
      setSelectionError('Adresse incomplète : sélectionnez une adresse avec numéro civique, rue et code postal.');
      return;
    }
    setSelectionError(null);

    const parsed = parsePlace(toPlaceResult(place));
    if (place.formattedAddress) onChangeRef.current(place.formattedAddress);
    hasSelectionRef.current = parsed !== null;
    onSelectRef.current?.(parsed);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectionError(null);
    const next = e.target.value;
    onChange(next);

    // Texte modifié après une sélection : l'adresse structurée n'est plus fiable
    if (hasSelectionRef.current) {
      hasSelectionRef.current = false;
      onSelectRef.current?.(null);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!ready || next.trim().length < MIN_CHARS) {
      requestIdRef.current++;
      closeSuggestions();
      return;
    }
    debounceRef.current = setTimeout(() => void fetchSuggestions(next), DEBOUNCE_MS);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        break;
      case 'Enter':
        // Liste ouverte : sélectionne sans soumettre le formulaire parent
        e.preventDefault();
        void selectSuggestion(suggestions[activeIndex >= 0 ? activeIndex : 0]);
        break;
      case 'Escape':
        closeSuggestions();
        break;
    }
  };

  const isOpen = suggestions.length > 0;

  return (
    <div className={styles.wrapper}>
      <input
        id={id}
        type="text"
        className={styles.addressInput}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={closeSuggestions}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        {...aria}
      />

      {isOpen && (
      <ul id={listboxId} role="listbox" className={styles.suggestions}>
        {suggestions.map((s, index) => (
          <li
            key={s.placeId}
            id={`${listboxId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            className={index === activeIndex ? `${styles.suggestion} ${styles.suggestionActive}` : styles.suggestion}
            // mousedown plutôt que click : le blur de l'input fermerait la liste avant le click
            onMouseDown={(e) => {
              e.preventDefault();
              void selectSuggestion(s);
            }}
            onMouseEnter={() => setActiveIndex(index)}
          >
            {s.label}
          </li>
        ))}
      </ul>
      )}

      {loadError && <p className={styles.loadError}>{loadError}</p>}
      {selectionError && <p className={styles.loadError}>{selectionError}</p>}
    </div>
  );
}
