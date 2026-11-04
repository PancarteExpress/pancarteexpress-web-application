# Audit de performance et de robustesse : Pancarte Express

- Date : 2026-11-04, branche `perf-audit`, commit `8398e44`
- Méthode : agent `react-prod-auditor`, rapport seulement. Aucun fichier du projet n'a été modifié, sauf ce rapport.
- La mesure inclut la modification non commitée de `src/features/dashboard/components/dashboardContent/DashboardContent.tsx` (ligne 58, `{fullName}`). Les numéros de ligne de ce fichier sont ceux de la copie de travail.
- Tests au moment de l'audit : `npm run test:run` : 20 fichiers, 226 tests, tous réussis.

## Comment lire les chiffres

| Étiquette | Sens |
|---|---|
| **MESURÉ** | Sortie réelle d'un build, d'un serveur `next start` local ou taille d'un fichier. |
| **EXPÉRIENCE** | Mesuré aussi, mais sur une copie du projet dans un dossier temporaire, avec le correctif appliqué à cette copie. Le dépôt n'a pas été touché. |
| **ESTIMÉ** | Déduit de la lecture du code, avec un degré de confiance. |

- `kB` : unité du tableau de `next build`.
- `KiB gz` : ma propre mesure, gzip d'un chunk de `.next/static/chunks` ou d'une réponse HTML.
- La copie d'expérience utilise des variables d'environnement factices (aucun secret copié, base injoignable). Son build de référence reproduit celui du projet à 0,1 kB près, sur 3 routes : `/cart/checkout` (13,1 contre 13,2), `/services` (50,5 contre 50,6), `/dashboard` (8,42 contre 8,41).
- Les expériences ont été compilées sans vérification des types ni lint. Seul le correctif zod a été repassé dans `tsc` et Vitest (réussis).
- Aucune mesure navigateur (Lighthouse, LCP, INP) : rien de tel n'a été lancé.

---

## Tableau de base (sortie réelle de `npm run build`, statut : réussi)

```
Route (app)                           Size  First Load JS
┌ ○ /                                  0 B         122 kB
├ ○ /_not-found                        0 B         122 kB
├ ƒ /[locale]                      1.93 kB         196 kB
├ ƒ /[locale]/admin                6.86 kB         159 kB
├ ƒ /[locale]/bigFormat                0 B         151 kB
├ ƒ /[locale]/cart                 3.95 kB         155 kB
├ ƒ /[locale]/cart/checkout        13.2 kB         276 kB
├ ƒ /[locale]/contact               113 kB         265 kB
├ ƒ /[locale]/dashboard            8.41 kB         272 kB
├ ƒ /[locale]/forgot-password      2.38 kB         266 kB
├ ƒ /[locale]/login                2.14 kB         267 kB
├ ƒ /[locale]/register             3.89 kB         309 kB
├ ƒ /[locale]/residential              0 B         151 kB
├ ƒ /[locale]/services             50.6 kB         313 kB
├ ƒ /[locale]/shop                   682 B         152 kB
├ ƒ /api/auth/[...nextauth]            0 B            0 B
├ ƒ /api/auth/register                 0 B            0 B
├ ƒ /api/auth/store-group-status       0 B            0 B
├ ƒ /api/auth/update-password          0 B            0 B
├ ƒ /api/auth/update-profile           0 B            0 B
├ ƒ /api/auth/verify-email             0 B            0 B
├ ƒ /api/checkout                      0 B            0 B
├ ƒ /api/cron/cleanup-orders           0 B            0 B
├ ƒ /api/custom/forgot-password        0 B            0 B
├ ƒ /api/custom/reset-password         0 B            0 B
├ ƒ /api/custom/verify-reset-code      0 B            0 B
└ ƒ /api/webhooks/stripe               0 B            0 B
+ First Load JS shared by all       123 kB
  ├ chunks/c20516c263ef3a09.js     17.2 kB
  ├ chunks/c2d8dfc9e40000eb.js     59.2 kB
  ├ chunks/f3d483c7f4c6e69c.js     12.8 kB
  └ other shared chunks (total)    33.4 kB

ƒ Middleware                         51 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Build : `next build --turbopack`, Next 15.5.25, compilation en 5,7 s. Aucune route `●` (SSG) : toutes les pages sous `[locale]` sont dynamiques.

---

## Résumé des principaux constats

| # | Constat | Gain | Preuve | Risque |
|---|---|---|---|---|
| 1 | `import { z } from 'zod'` embarque zod complet, avec toutes ses langues, sur 7 routes. | **-64 kB** sur chaque route (ex. `/contact` 265 → 201) | EXPÉRIENCE | Faible |
| 2 | Le formulaire de services, les modales du dashboard et l'étape 2 de l'inscription sont chargés d'emblée, alors qu'ils n'apparaissent qu'après un clic. | `/services` **-77 kB**, `/dashboard` **-53 kB**, `/register` **-50 kB** (après le n° 1) | EXPÉRIENCE | Faible |
| 3 | Une panne passagère de la base **déconnecte l'utilisateur** : le callback `jwt` échoue et Auth.js efface le cookie de session. | Robustesse | EXPÉRIENCE (reproduit) | Moyen, touche l'auth |
| 4 | 8 pages publiques sans données sont rendues à chaque requête (`no-store`). Elles peuvent devenir statiques. | Fonctions et prefetchs servis par le CDN ; 0 kB de JS | EXPÉRIENCE | Moyen |
| 5 | Chaque page reçoit les 14 namespaces de traduction, dont 4 qu'aucun composant client n'utilise. | **-14 KiB** de HTML brut (-2,9 KiB gz) sur toutes les pages | EXPÉRIENCE | Faible |
| 6 | `framer-motion` (40,8 KiB gz) sert uniquement à des animations d'entrée, sur 2 pages. | `/` et `/register` **-42 kB** | EXPÉRIENCE | Moyen |
| 7 | `log: ["query"]` écrit chaque requête SQL dans les journaux, y compris en production. | Volume de journaux | Lecture du code | Faible |

**Ce qui ne rapporte presque rien (mesuré) :**
- passer `Footer`, `LoginView` et `LoginCredentials` côté serveur : **-1 kB** de JS (-2 kB sur `/login`), mais +0,3 KiB gz de HTML ;
- `optimizePackageImports` : **0 kB** sur toutes les routes testées.

La frontière serveur/client est donc saine : le poids vient de ce qui est chargé trop tôt, pas des directives `'use client'`.

---

## 1. Frontière serveur / client

**Total : 76 fichiers `'use client'`** (MESURÉ par recherche sur `src`).

| Classe | Nombre |
|---|---|
| Nécessaires | 70 |
| Déplaçables côté serveur | 3 |
| À découper | 3 |

**Placement :**
- Aucun `layout.tsx` ni `page.tsx` ne porte `'use client'`.
- Le graphe d'imports (script sur tout `src`) donne **15 vraies frontières** : des fichiers importés par un module serveur.
- Les **61 autres directives sont redondantes** : leur module est déjà client par son parent. Les retirer ne change rien au bundle, donc aucune action proposée.
- 6 composants sans directive sont client de fait : `ChoiceGroupShell`, `Notice`, `InstallationSummary`, `RemovalSummary`, `ServicesTable`, `UsersTable`.
- Pages presque entièrement clientes, parce que leur page importe directement une vue client : accueil, contact, panier, paiement, connexion, inscription, mot de passe oublié, dashboard, admin. Seuls accueil et contact ont une grande partie statique (F2, F3).

### Déplaçables (3)

| Fichier | Vérification | Gain | Risque |
|---|---|---|---|
| `src/features/layout/components/footer/Footer.tsx:1` | Seulement `useTranslations`. Parents : 3 layouts serveur. | Avec les 2 lignes suivantes : **MESURÉ -1 kB** (`/contact` 201 → 200), +2,8 KiB bruts de HTML (+0,3 KiB gz) | Faible, voir ci-dessous |
| `src/features/auth/components/loginView/LoginView.tsx:2` | Aucun hook. Parent : page serveur. | inclus (`/login` 203 → 201) | Faible |
| `src/features/auth/components/loginCredentials/LoginCredentials.tsx:2` | Seulement `useTranslations`. Enfants tous dotés de leur directive. | inclus | Faible |

**Piège mesuré :** une fois `Footer` en composant serveur, ses layouts doivent aussi appeler `setRequestLocale`. Sinon le rendu statique (D1) est silencieusement perdu : le build affiche `●` alors que le serveur répond `no-store`.

### À découper (3)

| Fichier | Partie interactive | Découpe proposée | Gain | Risque |
|---|---|---|---|---|
| `src/features/layout/components/header/Header.tsx:1` | `useState` du menu mobile (l. 32, 89, 98) | `MobileNavToggle` client, reste en serveur | ESTIMÉ ≤ 2 kB, confiance moyenne : `next/image` et `next/link` restent dans le bundle | Moyen, sert toutes les pages |
| `src/features/home/components/HomeView.tsx:1` | Témoignages (l. 38-43) et `motion` (l. 51-65) | `Testimonials` client, héros en CSS | ESTIMÉ ≤ 1 kB hors framer | Faible |
| `src/features/contact/components/ContactView.tsx:1` | Formulaire (l. 96-167) | `ContactHero` serveur + `ContactForm` client | ESTIMÉ ≤ 1 kB | Faible |

**Recommandation :** ne pas les faire pour le poids. Ces découpes sont absentes du plan principal, car leur gain ne se distinguerait pas du bruit de mesure.

### Nécessaires (70)

- **auth (9)** : `AuthNav`, `ForgotPasswordForm`, `GoogleLoginButton`, `LoginErrorMessage`, `LoginForm`, `RegisterCredentials`, `RegisterForm`, `RegisterPackages`, `RegisterView`
- **cart (5)** : `CartSummary`, `CartView`, `ProductCartItem`, `QuantityStepper`, `ServiceRequestCartItem`
- **checkout (3)** : `CardFields`, `CheckoutView`, `useCardPayment`
- **dashboard (6)** : `CreateGroupDialog`, `DashboardContent`, `MemberEmailSearch`, `ServiceOrders`, `UpdateGroup`, `UpdateProfile`
- **layout (1)** : `StorageOwnerSync`
- **services, champs et cadre (10)** : `AddressManager`, `CheckboxGroup`, `DateField`, `QuantityField`, `RadioGroup`, `TextField`, `TimeField`, `YesNoField`, `PlacementPicker`, `ServiceBlockWarning`
- **services, installation (17)** : `InstallationForm`, `MaterialsSelector`, `PlacedUnitsFields`, `PlacementFields`, `AddonsSection`, `AddonAssignmentRow`, `AssignmentsSection`, `OpenHouseAssignmentRow`, `TargetsPicker`, `DirectionalsSection`, `FlagsSection`, `FrameUnitFields`, `FramesSection`, `KeyboxSection`, `KitSection`, `OpenHouseSection`, `OtherSection`
- **services, retrait (6)** : `RemovalForm`, `RemovalMaterialsSelector`, `RemovalSimpleSections`, `RemovalUnitsFields`, `RemovalAddonsSection`, `RemovalFramesSection`
- **services, assemblage (3)** : `AddressServices`, `ServiceForm`, `ServicesSummary`
- **shop (1)** : `AddToCartButton`
- **superAdmin (6)** : `DeleteGroupButton`, `GroupsTable`, `SuperAdminDashboard`, `AccountTypeSelect`, `DeleteUserButton`, `ServiceBlockButton`
- **shared (3)** : `LocalLink`, `AddressAutocomplete`, `LanguageSwitcher`

`CartSummary`, `RegisterCredentials`, `RemovalFramesSection` et `YesNoField` n'ont pas d'interactivité propre, mais leur parent est client et leur passe des fonctions ou un état du store : ils ne peuvent pas passer côté serveur.

---

## 2. Poids des pages

### Ce que contient chaque page (MESURÉ, chunks attribués par décomposition des modules Turbopack)

Socle de toutes les routes `[locale]` : **151 kB**, dont 123 kB partagés (React et routeur, 57,9 KiB gz pour le plus gros chunk), `next-intl` (12,1 KiB gz), Header et `next/image` (11,5 KiB gz).

| Page | First Load | Au-dessus du socle (KiB gz) |
|---|---|---|
| `/contact` | **265 kB** | zod 94,1 ; react-hook-form 14,3 ; resolver 1,2 ; `ContactView` 1,9 |
| `/services` | **313 kB** | même bloc zod + RHF (109,2) ; formulaires + `react-day-picker` + `date-fns` + locale frCA 46,7 ; 2,8 (autocomplétion) |
| `/register` | **309 kB** | bloc zod + RHF (109,2) ; `framer-motion` 40,8 ; 3,8 ; 1,2 |
| `/cart/checkout` | **276 kB** | bloc zod + RHF (109,2) ; `CheckoutView` + `@stripe/react-stripe-js` 9,6 ; 3,3 (autocomplétion) |

### Les 113 kB de `/contact` : chiffre confirmé, mais trompeur

- `Size` vaut bien 113 kB, mais `/contact` n'est **pas plus lourde que ses voisines** : `First Load JS` 265 kB, contre 266 kB pour `/forgot-password` et 267 kB pour `/login`.
- Turbopack a produit deux copies du même bloc zod + RHF : `a55aceaecd…` pour `/contact` seule, `b01f6384e7…` partagé par 6 routes. Elles ont la même taille (468,4 KiB bruts) et diffèrent à partir de l'octet 45 542. `Size` ne compte que ce qui n'est pas partagé, d'où les 113 kB.
- Effet réel : un visiteur qui va de `/contact` à `/login` retélécharge ce bloc. La duplication subsiste après le correctif zod. Aucune action dans le code du projet ; la cause exacte n'a pas été établie.

### Constats

**P1. `import { z } from 'zod'` embarque zod entier.** Le plus rentable de l'audit.
- **Fichiers** : 12 fichiers hors tests, dont `src/lib/auth/auth.schema.ts:1`, `src/lib/orders/checkout.schema.ts:1`, `src/lib/groups/groups.schema.ts:1`, `src/features/contact/schemas/contact.schema.ts:1`, `src/features/services/schemas/shared.ts:1`, `src/features/services/schemas/installation.schema.ts:1`.
- **Problème** : le module zod pèse 393,7 KiB bruts, 94,1 KiB gz, et contient toutes les langues (« Ungültige Eingabe », etc.).
- **Gain, EXPÉRIENCE** : avec `import * as z from 'zod'`, le module tombe à 114,4 KiB bruts, 31,7 KiB gz, sans aucune chaîne de langue.

| Route | Avant | Après |
|---|---|---|
| `/contact` | 265 | **201** |
| `/forgot-password` | 266 | **202** |
| `/login` | 267 | **203** |
| `/dashboard` | 272 | **208** |
| `/cart/checkout` | 276 | **212** |
| `/register` | 309 | **246** |
| `/services` | 313 | **249** |

- **Correction** : remplacer l'import dans ces 12 fichiers. `import type { z }` (`checkoutApi.ts:1`) et `{ ZodError }` (serveur) ne changent pas.
- **Vérification** : `tsc` sans erreur et 226 tests réussis sur la copie avec ce correctif.
- **Risque** : faible. **Confiance sur le gain** : élevée, mesuré.

**P2. `src/features/services/components/serviceForm/ServiceForm.tsx:6,7,13` : tout le formulaire est chargé d'emblée.**
- **Problème** : `requestType` vaut `null` au départ (l. 35). `AddressManager` et `AddressServices` n'apparaissent qu'après un clic (l. 73-85).
- **Piège** : l'import de la barrel `fields` (l. 7) tire aussi `DateField`, donc `react-day-picker` et sa CSS (`DateField.tsx:7`).
- **Gain, EXPÉRIENCE** (cumulé après P1, 249 kB au départ) :

| Étape | First Load |
|---|---|
| `next/dynamic` sur `AddressServices` | 193 kB |
| `RadioGroup` et `Notice` importés directement, sans la barrel | 177 kB |
| `next/dynamic` sur `AddressManager` | **172 kB** |

- **Point à tester** : `handleSaveAll` (`AddressServices.tsx:72-75`) traite une référence vide comme « invalide ». Si le formulaire n'est pas encore chargé, un clic sur Enregistrer ne sauvegarde rien, sans message. La fenêtre est très courte.
- **Risque** : faible. **Confiance** : élevée.

**P3. `src/features/dashboard/components/dashboardContent/DashboardContent.tsx:5,10,11` : modales chargées d'emblée.**
- **Problème** : `UpdateProfile`, `UpdateGroup` et `CreateGroupDialog` ne s'affichent que sur clic (l. 141-159), sauf `CreateGroupDialog` pour un `groupAdmin` sans groupe. Ils sont les seuls à tirer zod et RHF sur cette route.
- **Gain, EXPÉRIENCE** : **208 → 155 kB** (après P1).
- **Correction** : `next/dynamic` sur les 3 imports.
- **Risque** : faible. Délai au premier affichage de la modale (taille du chunk sur le réseau). **Confiance** : élevée.

**P4. `src/features/auth/components/registerView/RegisterView.tsx:5` : étape 2 chargée à l'étape 1.**
- **Problème** : le formulaire n'apparaît qu'après le choix d'un forfait (l. 33).
- **Gain, EXPÉRIENCE** : **-50 kB** (204 → 154 kB, mesuré avec framer retiré). Sans le retrait de framer, attendu 246 → environ 196 kB (ESTIMÉ, confiance élevée).
- **Correction** : `next/dynamic` sur `RegisterCredentials`.
- **Risque** : faible. Même réserve de délai que P3.

**P5. `src/features/home/components/HomeView.tsx:16` et `src/features/auth/components/registerPackages/RegisterPackages.tsx:6` : `framer-motion` pour des animations d'entrée.**
- **Problème** : `motion` n'y sert qu'à `initial` / `animate` / `transition` (fondu et translation au montage), aucun geste ni `AnimatePresence`. Ces deux fichiers sont les seuls utilisateurs. Le chunk pèse 40,8 KiB gz.
- **Gain, EXPÉRIENCE** :

| Option | `/` | `/register` (après P1) |
|---|---|---|
| Actuel | 196 kB | 246 kB |
| `LazyMotion` + `m` + `domAnimation` | 182 kB | 231 kB |
| Retrait complet, remplacé par des `@keyframes` CSS | **154 kB** | **204 kB** |

- **Limite de la mesure** : le retrait a été mesuré avec un substitut, sans compter les quelques lignes de CSS à ajouter.
- **Risque** : moyen. Il faut retrouver à l'œil les mêmes durées, délais et courbes. Comparer côte à côte en `fr` et `en` : l'accueil a deux variantes (l. 50-60).
- **Dépendance** : aucune ajoutée, `framer-motion` peut être retirée de `package.json` à la fin.

**P6. `src/app/[locale]/layout.tsx:19,22` : tous les messages sont envoyés à chaque page.**
- **Problème** : les 14 namespaces (29 405 octets en `fr`, MESURÉ) sont sérialisés dans chaque réponse. Ce poids n'apparaît pas dans First Load JS, il est dans le HTML et dans le RSC.
- **Vérification** : `bigFormat`, `residential`, `products` et `shop` ne sont utilisés que par des composants serveur (`BigFormatView`, `ResidentialView`, `ProductCard`, `ShopView`, `CategoryNav`), hors du graphe client d'après le script. Ils pèsent 15 755 octets, soit **54 %** du total.
- **Gain, EXPÉRIENCE** (état cumulé avec rendu statique) :

| Page | HTML avant | HTML après | gz avant | gz après |
|---|---|---|---|---|
| `/fr/contact` | 56,3 KiB | **42,3 KiB** | 13,3 KiB | **10,3 KiB** |
| `/fr/cart` | 51,1 KiB | **37,0 KiB** | 12,5 KiB | **9,4 KiB** |
| `/fr/bigFormat` | 127,0 KiB | **113,0 KiB** | 17,3 KiB | **15,2 KiB** |

- **Correction** : passer au provider un sous-ensemble sans ces 4 namespaces. Les composants serveur lisent la configuration de requête, ils ne sont pas touchés.
- **Risque** : faible. Le futur composant client qui utiliserait l'un d'eux afficherait la clé brute.
- **Aller plus loin** : filtrer par page. EXPÉRIENCE sur `/fr/contact`, avec seulement `header`, `errors`, `contact`, `footer` : 53,4 → 29,2 KiB, gz 13,1 → 6,3 KiB. Mais un provider imbriqué **remplace** les messages au lieu de les fusionner (`use-intl`, `messages: void 0 === i ? w?.messages : i`). Il faudrait donc lister les namespaces de chaque page. Risque moyen, phase optionnelle.

### Vérifications sans problème

| Point | Résultat |
|---|---|
| `react-icons` | Pas de problème. Aucun chunk notable (le module `GenIcon` fait 1 KiB gz), imports par sous-paquet, déjà traités par Next. |
| `optimizePackageImports` | Absent de `next.config.ts`, **inutile**. Testé avec `framer-motion`, `zod`, `react-day-picker`, `react-hook-form`, `@stripe/react-stripe-js` : **0 kB de gain** (EXPÉRIENCE). |
| Stripe | Pas lourd : 9,6 KiB gz, avec `CheckoutView`. Le script `js.stripe.com`, hors First Load JS et non mesuré, est lancé au chargement du module (`stripeClient.ts:6`), y compris pour un panier sans paiement. Stripe recommande de le charger tôt pour sa détection de fraude : aucune action proposée. |
| Google Maps | Pas de problème. Chargé à la demande au montage d'`AddressAutocomplete` (`googleMapsLoader.ts`, l. 98-110 du composant), une seule fois. |
| `/admin` | 159 kB : pas de zod ni de RHF. |
| Compilation ICU de `next-intl` | L'option expérimentale `messages.precompile` existe dans la version installée (4.14.5). Non testée : elle impose une autre organisation des catalogues. Hors plan. |
| Bundler | Le build webpack échoue sur le chargement dynamique de `src/i18n.ts` (`Can't resolve '@/messages'`), aucune comparaison possible. Hors périmètre. |

---

## 3. Robustesse

### Présence des fichiers spéciaux (MESURÉ)

| Groupe | `error.tsx` | `not-found.tsx` | `loading.tsx` | `global-error.tsx` | Suspense sur les données |
|---|---|---|---|---|---|
| racine `src/app` | absent | absent | absent | absent | n/a |
| `[locale]` | absent | absent | absent | n/a | n/a |
| `(public)` | absent | absent | absent | n/a | absent (`/services` attend `auth()` et la BD) |
| `(auth)` | absent | absent | absent | n/a | seulement `LoginErrorMessage.tsx:34` |
| `(protected)` | absent | absent | absent | n/a | absent (`/dashboard` attend 3 requêtes) |
| `(superAdmin)` | absent | absent | absent | n/a | absent (`/admin` attend 3 requêtes) |

**Conséquences :**
- `/fr/inexistant` répond 404 (MESURÉ) avec la page par défaut de Next, sans `Header`, sans traduction.
- Une erreur serveur (Neon injoignable, `findUniqueOrThrow` à `groups.service.ts:63`) affiche la page d'erreur par défaut de Next.
- Aucun retour visuel pendant une navigation vers `/dashboard` ou `/admin`.

Ajouter ces fichiers crée des états visibles : **décisions D-A et D-B, hors plan principal**.

### Constats

**R1. `src/app/auth.ts:147` : une erreur de base déconnecte l'utilisateur. Le plus grave de cette section.**
- **Problème** : `prisma.user.findUnique` n'est pas protégé dans le callback `jwt`. Si la lecture échoue, `@auth/core` (`lib/actions/session.js`, bloc `catch`) efface le cookie de session.
- **EXPÉRIENCE, reproduit** (jeton valide, base injoignable) :
  - `GET /api/auth/session` → `200`, corps `null`, `set-cookie: authjs.session-token=; Max-Age=0` ;
  - `GET /fr/dashboard` → `307` vers `/fr/login` ;
  - journal : `JWTSessionError`.
- **Impact** : avec une base serverless comme Neon, un réveil lent ou un délai dépassé pendant un appel peut déconnecter un client, panier en cours compris dans le parcours. Fréquence réelle inconnue, à observer en production.
- **Correction** : distinguer « compte absent » (`null`, session invalidée, à conserver) de « lecture impossible » (`try/catch`, conserver le jeton existant et journaliser).
- **Compromis** : pendant une panne, le rôle affiché vient du dernier jeton. Les routes sensibles relisent déjà le rôle en base (`groups.actions.ts:57`, `serviceAccess.service.ts:13`).
- **Risque** : moyen, touche l'auth. **Décision D-C, avec test Vitest.**

**R2. `src/features/home/components/HomeView.tsx:66,101,119` et `src/features/bigFormat/components/BigFormatView.tsx:60` : liens sans locale.**
- **Problème, MESURÉ** : `/services` répond `307` vers `/fr/services`, y compris avec `Accept-Language: en` et le cookie `NEXT_LOCALE=en` (`localeDetection: false`).
- **Impact** : un visiteur anglophone qui clique passe en français, avec une redirection de plus.
- **Risque** : faible, mais comportement visible. **Décision D-D.**

**R3. `src/features/shop/components/ProductCard.tsx:24` : lien de produit vers une page inexistante.**
- **Problème, MESURÉ** : `/shop/boites-a-cles` → `307` → `/fr/shop/boites-a-cles` → **404**. Aucune route `shop/[slug]`. Chaque carte en génère un, et `next/link` tente aussi de le précharger.
- **Décision D-D** : retirer le lien ou créer la page.

**R4. `src/app/layout.tsx:13` : `<html>` sans attribut `lang`.**
- **MESURÉ** : absent du HTML de `/en/contact`. Effet sur les lecteurs d'écran et le référencement.
- **Contrainte** : lire la locale avec `headers()` dans ce layout rendrait tout le site dynamique et annulerait D1. Il faut déplacer `<html>` dans `[locale]/layout.tsx`, ce qui demande de revoir `src/app/page.tsx` et le 404 racine. **Décision D-E.**

**R5. `src/features/cart/components/cartSummary/CartSummary.tsx:34,36` : note affichée deux fois.** Même ligne `servicesQuoteNote` dupliquée. Bug visible, hors performance : **décision D-D.**

**R6. `src/middleware.ts:19` : en-tête `x-locale` jamais lu.** Aucune lecture dans `src` (MESURÉ par recherche). Code mort, gain négligeable. Risque faible. Optionnel.

---

## 4. Données

**Bon point :** aucun fetch de lecture côté client. Tous les `fetch` de `src/features` sont des envois (formulaires, paiement), la seule lecture étant `/api/auth/session`, faite par `SessionProvider`. Pas de N+1 trouvé. `Promise.all` est utilisé sur `/dashboard` et `/admin`. Le singleton Prisma est correct. Les index couvrent les listes principales (`@@index([userId, createdAt])`).

**D1. Pages dynamiques qui peuvent être statiques.**
- **Fichiers** : `src/app/[locale]/layout.tsx:10-19` et les pages publiques.
- **Cause** : sans `generateStaticParams` ni `setRequestLocale`, `next-intl` lit la locale dans `headers()`.
- **MESURÉ** : toutes les pages répondent `cache-control: private, no-cache, no-store`.
- **EXPÉRIENCE**, `generateStaticParams` sur chaque page statique et `setRequestLocale` dans le layout et les pages :
  - `/`, `/contact`, `/cart`, `/cart/checkout`, `/bigFormat`, `/residential`, `/login`, `/register`, `/forgot-password` : `cache-control: s-maxage=31536000` ;
  - `/services`, `/shop`, `/dashboard`, `/admin` restent dynamiques ; `/fr/dashboard` et `/fr/admin` redirigent toujours vers `/fr/login` sans session.
- **Ce qui reste dynamique et pourquoi** : `/services` (`auth()` à `services/page.tsx:11`), `/shop` (`searchParams`), `/dashboard` et `/admin` (guards). Aucun `auth()` dans un layout partagé : la racine utilise seulement `SessionProvider`, côté client.
- **Variante à préférer** : `generateStaticParams` **sur les pages**, pas dans le layout. Placé dans le layout, le build marque `/admin` et `/dashboard` en `●` alors qu'ils restent dynamiques : la sortie du build devient trompeuse.
- **Important : le marqueur `●` ne prouve rien.** Dans une expérience, le build affichait `●` et le serveur répondait `no-store`. Vérifier avec `curl -I` sur chaque page.
- **Gain** : 0 kB de JS. Documents et prefetchs de ces pages servis par le CDN, sans fonction Vercel. ESTIMÉ : la majorité des appels de fonction de pages publiques disparaît, confiance moyenne (aucune donnée de trafic).
- **Compromis à connaître** :
  - le prefetch d'une page statique renvoie tout le RSC, soit **0,2 KiB → 35,9 KiB (10,0 KiB gz)**, ou **22,6 KiB (7,0 KiB gz)** après P6 (EXPÉRIENCE, simulé avec `curl`). Moins de fonctions, mais plus d'octets vers le visiteur. D'où l'ordre : P6 avant D1 ;
  - `/login` : le message d'erreur (`useSearchParams`, `LoginErrorMessage.tsx:19`) n'apparaîtrait qu'après l'hydratation. **`/login` est sortie du plan : décision D-F.**
- **Risque** : moyen.

**D2. `src/app/auth.ts:147` et `src/app/layout.tsx:15` : chaque lecture de session interroge la base.**
- **Problème** : le callback `jwt` lit `user` et `group` à chaque appel de `auth()` et de `/api/auth/session`. `SessionProvider`, sans prop `session`, lance une requête à chaque chargement complet de page, puis à chaque retour sur l'onglet (`refetchOnWindowFocus` vaut `true` par défaut, `next-auth/react.js:305`).
- **Impact, par lecture du code** :

| Situation | Fonction | Lecture BD session |
|---|---|---|
| Visiteur anonyme, page quelconque | 1 (`/api/auth/session`) | 0 |
| Connecté, page publique | 1 | 1 |
| Connecté, chaque retour sur l'onglet | 1 | 1 |
| `/dashboard` | 1 de plus | 3 (layout, page, client) |

- **Compromis** : cette relecture est volontaire, elle invalide la session d'un compte supprimé (`auth.ts:163`) et garde le rôle à jour. Ne pas la retirer sans décision.
- **Options** : `refetchOnWindowFocus={false}`, ou relecture limitée à un intervalle (ex. 5 min) dans le jeton.
- **Gain** : ESTIMÉ, élimine la majorité des lectures de session pour un utilisateur connecté, confiance moyenne.
- **Risque** : moyen, change le délai de propagation d'un rôle. **Décision D-C.**

**D3. `src/app/[locale]/(protected)/dashboard/page.tsx:9` : session lue deux fois sur le serveur.**
- **Problème** : le layout passe par `requireRolePage` (`cache()`, `guard.ts:9`), la page appelle `auth()` directement, ce qui contourne le cache.
- **Gain** : -1 lecture BD par affichage. ESTIMÉ, confiance élevée.
- **Correction** : `requireRolePage(["user", "groupAdmin", "superAdmin"], locale)` dans la page.
- **Risque** : faible, mais touche l'auth : **à valider**.

**D4. `src/lib/orders/server/orders.service.ts:5-40` : champs sélectionnés et envoyés au client sans être affichés.**
- **Problème** : `ServiceOrders` n'utilise ni `status`, `paidAt`, `productsStatus`, `deliveryMode`, `deliveryStreet`, `deliveryCity`, ni `description`, `scheduledFor`, `completedAt` (vérifié par recherche dans `src/features/dashboard`). Ils partent dans le RSC, dont l'adresse de livraison.
- **Autres cas** :
  - `src/lib/users/server/user.service.ts:15,19` : `provider` et `_count.orders` non utilisés par l'admin ; le `_count` coûte un comptage par utilisateur ;
  - `src/lib/services/server/services.service.ts:7-11,95-106` : `status`, `price`, `orderId`, `scheduledFor` non affichés par `ServicesTable`.
- **Gain** : ESTIMÉ, proportionnel au nombre de commandes, non mesurable sans données (base vide).
- **Avant de couper** : les cartes « X en cours · Y terminées » du dashboard (l. 86-88) sont des textes provisoires et auront besoin de `status`.
- **Risque** : faible, `tsc` détecte toute utilisation restante.

**D5. Listes sans limite.** `orders.service.ts:46,82`, `user.service.ts:25`, `groups.service.ts:39`, `services.service.ts:75`.
- **Problème** : aucun `take`. Les trois listes admin sont chargées et sérialisées d'un bloc, même si un seul onglet est visible, avec un `orderBy` sur 3 niveaux de relation (`services.service.ts:76`).
- **Impact** : ESTIMÉ nul aujourd'hui (base vide), croissant avec le volume. La sélection Prisma imbriquée produit plusieurs requêtes SQL par liste (`relationJoins` n'est pas activé).
- **Risque** : une limite tronquerait la liste, c'est visible. **Décision D-G.**

**D6. `src/lib/prisma.ts:9` : `log: ["query"]` sans condition d'environnement.**
- **Problème** : chaque requête SQL, avec sa forme, est écrite dans les journaux de production. Sur `/dashboard`, cela représente plusieurs lignes par visite. Constaté à la lecture du code, volume non chiffré.
- **Correction** : `query` en développement seulement.
- **Gain** : volume de journaux Vercel, lisibilité des vraies erreurs. Sans effet sur la latence perceptible (ESTIMÉ).
- **Risque** : faible.

**Cron `/api/cron/cleanup-orders`** : pas de problème de volume, `take: 50`, sélection minimale (`cleanup.service.ts:17-22`).

---

## 5. Rendu React

**Bons points :** `useCart` (sélecteurs + `useShallow`), `ServiceForm`, `AddressServices`, `LoginForm` et `StorageOwnerSync` sont déjà granulaires. Pas d'objet recréé passé en contexte applicatif. Aucun `Array(n).fill` dans `src` (MESURÉ par recherche).

**C1. `src/features/auth/hooks/useAuth.ts:11,16-42` : store entier et effet répété.**
- **Problème** : `useAuthStore()` sans sélecteur abonne le composant à tout le store. L'effet tourne pour chaque consommateur : `AuthNav` est monté **2 fois** dans `Header` (l. 47 et 110). Chaque exécution remplace `user` par un nouvel objet, ou appelle `logout()`, et le `persist` réécrit `localStorage`.
- **Impact** : au moins 2 écritures et des rendus supplémentaires de l'en-tête à chaque chargement, connecté ou non. Par lecture du code.
- **Gain** : ESTIMÉ faible (quelques ms), confiance moyenne.
- **Correction** : `useShallow` sur les actions, et sortir la synchronisation du hook pour qu'elle ne tourne qu'une fois (`StorageOwnerSync` existe déjà).
- **Risque** : faible à moyen, touche l'auth : à valider.

**C2. `src/features/auth/store/authStore.ts:28-31` : `user` copie la session et persiste dans `localStorage`, avec `devtools` actif en production.**
- **Problème** : état dérivé de `useSession`. Le seul usage relevé est `isAuthenticated && user` dans `AuthNav:21`. Courriel, nom et rôle restent dans `localStorage`.
- **Correction immédiate** : `devtools` avec `enabled: process.env.NODE_ENV !== 'production'`.
- **Gain** : ESTIMÉ < 1 kB.
- **Risque** : faible. Retirer `user` du store demande une décision (D-C).

**C3. `src/features/services/hooks/useAddresses.ts:5` : `useAddressStore()` renvoie le store entier.**
- **Problème** : `AddressManager:12` se redessine à chaque changement, y compris `saveService` dans un autre formulaire.
- **Gain** : ESTIMÉ faible : composant de 250 lignes, changements rares.
- **Correction** : `useShallow` sur les 6 valeurs utilisées.
- **Risque** : faible.

**C4. `src/features/auth/components/registerForm/RegisterForm.tsx:31,92-96` : état dérivé d'une prop par effet.**
- **Problème** : `groupStatus` vaut `null` au premier rendu, puis l'effet le recopie depuis `packageChoice`. Le composant rend `null` entre-temps (l. 103).
- **Gain** : 1 rendu de moins, ESTIMÉ négligeable.
- **Correction** : dériver directement, car le `setGroupStatus` des radios (l. 117, 123) appelle déjà `setPackageChoice`.
- **Risque** : faible.

**C5. `src/features/cart/components/quantityStepper/QuantityStepper.tsx:21-23` : `useEffect` qui recopie `value` dans `draft`.** Un rendu de plus à chaque changement. Gain négligeable, à ne pas prioriser.

**C6. `src/features/superAdmin/components/usersTable/UsersTable.tsx:39-45` : la `Map` des membres est recalculée à chaque frappe de recherche.**
- **Problème** : pas de `useDeferredValue` ni de `useMemo` ; toutes les lignes se redessinent.
- **Gain** : nul aujourd'hui, ESTIMÉ sensible au-delà de quelques centaines d'utilisateurs. Pas d'optimisation prématurée : à reconsidérer avec le volume.

---

## 6. Images et polices

**Images, pas de problème sur :**
- aucun `<img>` : tout passe par `next/image` (MESURÉ) ;
- `sizes` présent sur toutes les images en `fill` (`ResidentialView:54`, `BigFormatView:79`, `ProductCard:30`, `ProductCartItem:26`) ;
- taille des fichiers correcte : le plus gros fichier de `public/` fait 319 Ko (`residential/thumbnails/image1.jpg`), total 9,3 Mo.

**I1. `src/features/home/components/HomeView.tsx:81,128,134,140` : `priority` sur des images sous le héros.**
- **Problème** : 4 images en plus du héros (l. 74) sont préchargées. Les 3 pictogrammes de 94 px sont nettement sous la ligne de flottaison, `membership.jpg` l'est selon la largeur (`aspect-ratio: 1845 / 748` du héros). Seul le héros en a besoin.
- **Gain** : ESTIMÉ 4 préchargements inutiles de moins (26 Ko de sources au total), confiance élevée sur le nombre, à confirmer avec Lighthouse sur le LCP.
- **Risque** : faible.

**I2. `next.config.ts` : pas de `images.minimumCacheTTL`.**
- **Problème** : par défaut 60 s, avec des images en chemin `public/` qui ne changent presque jamais.
- **Gain** : ESTIMÉ moins de transformations Vercel, non chiffré (aucune donnée de facturation).
- **Correction** : par exemple `minimumCacheTTL: 2592000` (30 jours).
- **Compromis** : une image remplacée sous le même nom resterait en cache jusqu'à 30 jours : changer son nom.
- **Risque** : faible.

**I3. `src/features/home/components/HomeView.module.css:6,283` : images de fond CSS non optimisées.**
- **Problème** : `slider-bg.jpg` (67 Ko) et `installation.jpg` (44 Ko), servies telles quelles. `slider-bg.jpg` est peut-être l'élément LCP de l'accueil (non vérifié, pas de mesure navigateur).
- **Correction** : à décider après Lighthouse. Passer en `next/image` touche la mise en page.
- **Risque** : moyen. Hors plan.

**I4. Doublons : 56 fichiers `.webp` jamais référencés (MESURÉ : 0 mention de `.webp` dans `src` et `messages`).**
- **Impact** : poids du dépôt seulement. `next/image` part des `.jpg` et sert déjà un format optimisé.
- **Correction** : supprimer après confirmation que ce ne sont pas les originaux à conserver. Non urgent.

**Polices.** `next/font` n'est utilisé nulle part.

**I5. `src/features/home/components/HomeView.module.css:1` : Poppins par `@import` Google Fonts.**
- **Problème, MESURÉ** : l'`@import` reste dans la CSS construite (`e5c0bceb…`). C'est une feuille externe bloquante sur l'accueil, avec un domaine tiers de plus.
- **Effet de bord** : `LanguageSwitcher.module.css:14` utilise aussi Poppins, mais la police n'est chargée que là où cette CSS l'est.
- **Gain** : ESTIMÉ moins de blocage de rendu sur `/`, à mesurer avec Lighthouse.
- **Correction** : `next/font/google`, sans dépendance à ajouter, limité à l'accueil pour ne rien changer ailleurs.
- **Risque** : faible à moyen. Le nom de police généré impose de remplacer les 9 déclarations `font-family` par une variable.

**I6. `Montserrat`, `Inter` et `JetBrains Mono` ne sont jamais chargées.**
- **Problème, MESURÉ** : 41 déclarations `Montserrat`, 32 `Inter`, 1 `JetBrains Mono` dans les CSS, aucun `@font-face` ni lien. Le visiteur voit la police installée localement, sinon `sans-serif`. Un poste qui a Montserrat installée ne voit pas le même site qu'un autre.
- **Correction** : les charger changerait l'apparence du site. **Décision D-H.**

---

## Plan par phases

**Règles :**
- une phase = un commit ;
- aucun changement de comportement visible attendu ;
- après chaque phase : `npx tsc --noEmit`, `npm run lint`, `npm run test:run`, `npm run build`, puis comparaison avec le tableau de base ;
- aucune dépendance à ajouter dans ce plan (`framer-motion` serait retirée, pas ajoutée) ; toute dépendance nouvelle demanderait une validation.

Tous les « attendu » en kB viennent des builds d'expérience, dans cet ordre cumulé, sauf mention contraire.

| Phase | Contenu | Routes à surveiller et gain attendu | Risque |
|---|---|---|---|
| **1** | P1 : `import * as z from 'zod'` (12 fichiers) | `/contact` 265→201, `/login` 267→203, `/forgot-password` 266→202, `/cart/checkout` 276→212, `/dashboard` 272→208, `/register` 309→246, `/services` 313→249. Inchangés : `/`, `/admin`, `/cart`, `/shop` | Faible |
| **2** | D6 : `log: ["query"]` en développement seulement | Aucun kB. Vérifier l'absence de `prisma:query` sous `next start` | Faible |
| **3** | D3 : réutiliser le guard dans la page dashboard. **Validation requise (auth)** | Aucun kB. -1 lecture de session par affichage. Sans session, `/fr/dashboard` doit toujours rediriger | Faible |
| **4** | P3 : `next/dynamic` sur les 3 modales du dashboard | `/dashboard` 208→155 | Faible |
| **5** | P2 : `next/dynamic` + imports directs dans `ServiceForm` | `/services` 249→172. Tester le parcours complet : type, adresse, service, enregistrer, panier | Faible |
| **6** | P4 : `next/dynamic` sur `RegisterCredentials` | `/register` 246→environ 196 (ESTIMÉ, 204→154 mesuré avec framer retiré) | Faible |
| **7** | P6 : retirer du provider `bigFormat`, `residential`, `products`, `shop` | Aucun kB de JS. HTML de chaque page -14 KiB bruts, environ -3 KiB gz. Parcourir toutes les pages : aucune clé brute | Faible |
| **8** | D1 : `generateStaticParams` et `setRequestLocale` sur `/`, `/contact`, `/cart`, `/cart/checkout`, `/bigFormat`, `/residential`, `/register`, `/forgot-password`, sans `/login` | Marqueur `ƒ`→`●` sur ces routes, 0 kB. **Vérifier `s-maxage` au `curl -I`, le marqueur ne suffit pas.** `/services`, `/shop`, `/dashboard`, `/admin` restent `ƒ` | Moyen |
| **9** | D4 : retirer les champs non affichés (`_count`, `provider`, adresse de livraison…), après avoir confirmé ce que les cartes du dashboard devront afficher | Aucun kB de JS. RSC de `/dashboard` et `/admin` réduit, non mesurable sans données | Faible |
| **10** | I1 + I2 : retirer 4 `priority`, ajouter `minimumCacheTTL` | Aucun kB. Comparer le LCP de `/` avec Lighthouse | Faible |
| **11** | P5 : animations de `HomeView` et `RegisterPackages` en CSS, retrait de `framer-motion` | `/` 196→154, `/register` environ 196→154 (substitut, CSS en plus). **Comparaison visuelle obligatoire, `fr` et `en`.** Repli : `LazyMotion`, `/` 182 kB | Moyen |
| **12** | I5 : Poppins via `next/font`, limité à l'accueil | Aucun kB de JS. Plus de `fonts.googleapis.com` dans la CSS construite. Comparaison visuelle de `/` | Faible à moyen |
| **13** | C1, C2 (`devtools`), C3 : sélecteurs Zustand granulaires. **Validation requise pour `useAuth`** | Moins de 1 kB attendu | Faible |
| *Option* | `Footer`, `LoginView`, `LoginCredentials` côté serveur, avec `setRequestLocale` dans `(public)/layout` et `(auth)/layout` | -1 kB, `/login` -2 kB, HTML +0,3 KiB gz. **Non recommandé** | Faible |
| *Option* | P6 par page, providers imbriqués | `/fr/contact` jusqu'à 29,2 KiB bruts, 6,3 KiB gz (expérience distincte, avant les autres retraits) | Moyen |

**État attendu après les phases 1 à 8, 11 (EXPÉRIENCE cumulée, avec `Footer` côté serveur en plus, soit -1 kB sur la plupart des routes) :**

| Route | Avant | Après |
|---|---|---|
| `/[locale]` | 196 kB | 153 kB |
| `/contact` | 265 kB | 200 kB |
| `/services` | 313 kB | 173 kB |
| `/register` | 309 kB | 153 kB |
| `/cart/checkout` | 276 kB | 211 kB |
| `/dashboard` | 272 kB | 154 kB |
| `/login` | 267 kB | 201 kB |
| `/forgot-password` | 266 kB | 201 kB |
| `/admin` | 159 kB | 159 kB |
| Partagé | 123 kB | 122 kB |

Cet état cumulé a été démarré avec `next start` : toutes les pages répondent correctement, et `/fr/dashboard` et `/fr/admin` redirigent vers `/fr/login` sans session. Aucun parcours n'a été testé dans un navigateur.

**Réserve sur les phases 4 à 6 :** `next/dynamic` n'ajoute pas d'état de chargement, mais le contenu arrive un peu plus tard au premier affichage. Tester en réseau lent. Si le vide est gênant, un indicateur devient un changement visible, donc une décision.

### Décisions à prendre (hors plan principal, comportement visible ou auth)

| # | Sujet | Options | Recommandation |
|---|---|---|---|
| **D-C** | Sessions et base (R1, D2, C2) | a) `try/catch` dans `jwt` pour ne plus déconnecter sur panne ; b) `refetchOnWindowFocus={false}` ; c) relecture du compte par intervalle ; d) retirer `user` du store persistant | **a) en priorité, avant la production**, avec test Vitest. b) ou c) selon le délai acceptable pour propager un rôle |
| **D-A** | `error.tsx`, `global-error.tsx`, `not-found.tsx` traduits | Nouvelles pages, nouvelles clés `fr` et `en` | À faire avant la production, au minimum `[locale]/error.tsx`, `global-error.tsx` et `[locale]/not-found.tsx` |
| **D-B** | `loading.tsx` / Suspense sur `/dashboard` et `/admin` | Nouvel état de chargement | À trancher. Attention : un `loading.tsx` change aussi ce que précharge `next/link` |
| **D-D** | Bugs visibles : liens sans locale (R2), lien produit en 404 (R3), note en double (R5) | Corriger ; pour R3, retirer le lien ou créer la page | Corriger R2 et R5 ; R3 dépend de vos intentions pour la fiche produit |
| **D-E** | `lang` sur `<html>` (R4) | Déplacer `<html>` dans `[locale]/layout.tsx` | À faire, compatible avec la phase 8 |
| **D-F** | `/login` statique | Message d'erreur affiché après hydratation (léger décalage) | À évaluer après la phase 8 |
| **D-G** | Pagination admin et historique (D5) | `take` et pagination, ou chargement par onglet | Non urgent, base vide. À prévoir avant d'avoir du volume |
| **D-H** | Polices `Montserrat` et `Inter` (I6) | Les charger avec `next/font` (apparence modifiée) ou les retirer des CSS | À décider : aujourd'hui l'affichage dépend du poste du visiteur |

### Points d'incertitude

- **Gains navigateur non mesurés** : LCP, INP, poids réel transféré. À mesurer avec Lighthouse avant et après la phase 10.
- **Prefetch** : simulé avec `curl` (`RSC: 1`, `Next-Router-Prefetch: 1`). Le nombre réel de requêtes par page en navigateur n'a pas été compté.
- **Coûts Vercel et Neon** : aucune donnée de trafic ni de facturation, donc aucun montant.
- **Mécanisme du gain zod** : le gain est mesuré, la cause (Turbopack ne peut pas éliminer le contenu de l'objet `z`, mais le peut pour un import de namespace) est mon interprétation.
- **Framer** : gain mesuré avec un substitut, CSS de remplacement non comptée. Équivalence visuelle à vérifier à l'œil.
- **Un 500 isolé sur `/fr/services`** dans une expérience intermédiaire, **non reproduit** dans les 6 builds suivants, dont une variante proche (rendu statique déclaré dans le layout). Il coïncide avec la disparition de fichiers vides de `node_modules` **dans la copie temporaire** (`client-only/index.js`, `server-only/empty.js`), restaurés ensuite. Cause probable, non prouvée. Le `node_modules` du projet n'a pas été touché.
- **Connexion Neon en production** : `DATABASE_URL` locale n'a ni `pgbouncer=true` ni `connection_limit` (seule la présence de ces chaînes a été vérifiée, sans lire les valeurs). Les variables Vercel n'ont pas été consultées. À vérifier selon la version de Prisma et la documentation Neon.
- **Volumes** : base vide hors superAdmin, donc les gains D4, D5 et C6 ne sont pas mesurables aujourd'hui.
- **R1, fréquence** : le mécanisme est reproduit, mais sa fréquence réelle sur Neon est inconnue.
