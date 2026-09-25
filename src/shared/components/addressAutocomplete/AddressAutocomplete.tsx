"use client";
import { useEffect, useRef, useState, type KeyboardEvent, type ChangeEvent } from 'react';

import styles from "./AddressAutocomplete.module.css";
import { loadGoogleMaps } from "@/shared/utils/googleMapsLoader";
import { ParsedAddress } from "@/shared/types/address";
import { parsePlace } from '@/shared/utils/parsePlace';

/*type GoogleAddressComponent = {
  types: string[];
  long_name: string;
  short_name: string;
};*/

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

export default function AddressAutocomplete({ 
    id,
    value,
    onChange,
    onSelect,
    placeholder = 'Commencez à taper votre adresse',
    disabled,
    ...aria
}: Props) {
    
    const inputRef = useRef<HTMLInputElement>(null);
    const hasSelectionRef = useRef(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const onChangeRef = useRef(onChange);
    const onSelectRef = useRef(onSelect);
    useEffect(() => {
        onChangeRef.current = onChange;
        onSelectRef.current = onSelect;
    });

    useEffect(() => {
        let cancelled = false;
        let autocomplete: google.maps.places.Autocomplete | null = null;

        loadGoogleMaps()
        .then(() => {
            if (cancelled || !inputRef.current) return;

            autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'ca' },
            // Limite les champs facturés par Google au strict nécessaire
            fields: ['address_components', 'formatted_address'],
            });

            autocomplete.addListener('place_changed', () => {
            if (!autocomplete) return;
            const place = autocomplete.getPlace();
            const parsed = parsePlace(place);

            if (place.formatted_address) onChangeRef.current(place.formatted_address);
            hasSelectionRef.current = parsed !== null;
            onSelectRef.current?.(parsed);
            });
        })
        .catch(() => {
            if (!cancelled) setLoadError("L'autocomplétion est indisponible. Vérifiez votre adresse manuellement.");
        });

        return () => {
        cancelled = true;
        if (autocomplete) google.maps.event.clearInstanceListeners(autocomplete);
        };
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        // Texte modifié après une sélection : l'adresse structurée n'est plus fiable
        if (hasSelectionRef.current) {
        hasSelectionRef.current = false;
        onSelectRef.current?.(null);
        }
    };

    // Entrée dans la liste de suggestions : sélectionne sans soumettre le formulaire parent
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        const suggestionsOpen = Array.from(document.querySelectorAll<HTMLElement>('.pac-container'))
        .some((el) => el.offsetParent !== null);
        if (suggestionsOpen) e.preventDefault();
    };

    return (
        <>
        <input
            ref={inputRef}
            id={id}
            type="text"
            className={styles.addressInput}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            {...aria}
        />
        {loadError && <p className={styles.loadError}>{loadError}</p>}
        </>
    );
}