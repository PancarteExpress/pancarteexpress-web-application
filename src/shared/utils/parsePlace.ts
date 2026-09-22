import type { ParsedAddress } from '@/shared/types/address';

type NameKey = 'long_name' | 'short_name';

export function parsePlace(place: google.maps.places.PlaceResult): ParsedAddress | null {
  const components = place.address_components;
  if (!components?.length) return null;

  const get = (type: string, key: NameKey = 'long_name'): string =>
    components.find((c) => c.types.includes(type))?.[key] ?? '';

  const streetNumber = get('street_number');
  const streetName = get('route');
  // Certaines municipalités du Québec n'ont pas de `locality`
  const city = get('locality') || get('sublocality_level_1') || get('administrative_area_level_3');

  if (!streetName || !city) return null;

  return {
    streetNumber,
    streetName,
    city,
    province: get('administrative_area_level_1', 'short_name'),
    postalCode: get('postal_code'),
    formatted: place.formatted_address ?? `${streetNumber} ${streetName}, ${city}`.trim(),
  };
}