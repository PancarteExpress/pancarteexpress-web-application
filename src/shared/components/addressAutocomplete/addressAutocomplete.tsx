"use client";
import { useEffect, useRef } from "react";

import styles from "./addressAutocomplete.module.css";

type GoogleAddressComponent = {
  types: string[];
  long_name: string;
  short_name: string;
};

interface Props {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    onCityChange?: (city: string) => void;
    onPostalCodeChange?: (postalCode: string) => void;
    onStreetAddressChange?: (streetAddress: string) => void;
    
}

export default function AddressAutocomplete({ value, onChange, onCityChange, onPostalCodeChange, onStreetAddressChange, id }: Props) {
    
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Attendre que window.google soit disponible
        const checkGoogleLoaded = setInterval(() => {
            // @ts-expect-error Google Maps API loaded globally
            if (window.google) {
            clearInterval(checkGoogleLoaded);
            initAutocomplete();
            }
        }, 100);

        function initAutocomplete() {
            // @ts-expect-error Google Maps API not typed globally
            if (!inputRef.current || !window.google) return;

            // @ts-expect-error Google Maps Autocomplete class
            const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'ca' },
            });

            autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();

            if (place.formatted_address) {
                onChange(place.formatted_address);
            }

            const streetNumber = place.address_components?.find((c: GoogleAddressComponent) => c.types.includes('street_number'))?.long_name ?? '';
            const route = place.address_components?.find((c: GoogleAddressComponent) => c.types.includes('route'))?.long_name ?? '';
            const streetAddress = `${streetNumber} ${route}`.trim();
            if (streetAddress) {
                onStreetAddressChange?.(streetAddress);
            }

            const cityComponent = place.address_components?.find((c: GoogleAddressComponent) => c.types.includes('locality'));
            if (cityComponent) {
                onCityChange?.(cityComponent.long_name);
            }

            const postalComponent = place.address_components?.find((c: GoogleAddressComponent) => c.types.includes('postal_code'));
            if (postalComponent) {
                onPostalCodeChange?.(postalComponent.long_name);
            }
            });
        }

        return () => clearInterval(checkGoogleLoaded);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <input
            className={styles.addressinput}
            ref={inputRef}
            id={id}
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Commencer a tapper votre adresse"
            autoComplete="off"
        />
    );
}