const SCRIPT_ID = 'google-maps-places';

let loadPromise: Promise<void> | null = null;

const isLoaded = (): boolean =>
  typeof window !== 'undefined' && Boolean(window.google?.maps?.places);

/**
 * Charge le script Google Maps une seule fois pour toute l'app.
 * Les appels concurrents partagent la même Promise.
 */
export function loadGoogleMaps(language = 'fr'): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps ne peut être chargé que côté client'));
  }
  if (isLoaded()) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY manquante'));
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const fail = (script: HTMLScriptElement) => {
      loadPromise = null; // permet une nouvelle tentative
      script.remove();
      reject(new Error('Échec du chargement de Google Maps'));
    };

    // Script déjà injecté (ex. rechargement à chaud) : on s'y rattache
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');

    script.addEventListener('load', () => (isLoaded() ? resolve() : fail(script)), { once: true });
    script.addEventListener('error', () => fail(script), { once: true });

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${apiKey}` +
        `&libraries=places&language=${language}&region=CA`;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return loadPromise;
}