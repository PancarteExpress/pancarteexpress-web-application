# Audit de structure : Pancarte Express (`src/`)

- Date : 2026-11-03, branche `structure-refactoring`, commit `a19e7c5`
- Méthode : agent `react-prod-auditor`, lecture seule
- Les numéros de ligne correspondent au commit `a19e7c5` et peuvent changer après les phases de refactorisation.

Mesures prises :
- graphe d'imports résolu par script (alias `@/` et chemins relatifs) sur 269 fichiers suivis par git ;
- `npx eslint src` : 0 erreur, **39 avertissements**, tous `no-unused-vars` ;
- `tsc` et `build` n'ont pas été lancés, parce qu'ils écrivent (`tsbuildinfo`, `.next`).

## Décisions prises après l'audit (2026-11-03)

- `createGroupAction` : supprimer. `requireRoleApi` : supprimer.
- `shared/schemas/address.ts` : supprimer. `lib/pricing/money.ts` : garder, avec `toCents`. `shared/utils/money.ts` (doublon) : supprimer.
- `server-only` sur `lib/prisma.ts` : oui, à condition que `prisma/seed.ts` et les tests Vitest continuent de fonctionner.
- `api/custom/*` : pas de renommage pour l'instant.
- Phases 1 à 3 : exécutées. Phases 4 à 8 : à valider une par une.

---

## Synthèse

| # | Constat majeur | Gravité |
|---|---|---|
| 1 | Du code serveur (Prisma, bcrypt, nodemailer) vit dans `src/features` et `src/utils`, et `src/lib` importe depuis `src/features` (dépendance inversée). | 🟠 |
| 2 | `requireSuperAdminAction`, `ActionError`, `toActionError` et `ActionResult` existent en **3 exemplaires**, alors que `src/lib/auth/actionGuard.ts` les fournit déjà. | 🟠 |
| 3 | Un transporteur nodemailer est créé **3 fois** ; seul `lib/email/transporter.ts` est correct. | 🟠 |
| 4 | Des schémas Zod sont rangés dans des dossiers `types/`, ou écrits directement dans des composants et des routes (le schéma du code à 6 chiffres existe 5 fois). | 🟡 |
| 5 | Casse incohérente : 7 composants en minuscules, `Login/` et `Register/` en PascalCase à côté de dossiers en camelCase. | 🟡 |
| 6 | 4 fichiers vides, 2 fichiers orphelins, une dizaine d'exports morts, 39 imports ou variables inutilisés. | 🟡 |
| 7 | `src/utils` (1 fichier) et `src/shared/lib` (1 fichier) n'ont pas de raison d'exister. | 🟡 |

---

## 1. Respect de l'architecture du CLAUDE.md

### 1.1 Code serveur hors de `src/lib`

| Fichier | Problème | Proposition |
|---|---|---|
| `src/features/auth/services/auth.service.ts` (234 l.) | Prisma, `node:crypto` et bcrypt sans `server-only`. Il n'est importé que par 7 routes API. | → `src/lib/auth/server/auth.service.ts` |
| `src/features/auth/services/email.ts` (164 l.) | Envoi d'emails côté serveur, sans `server-only`. Importé par `src/app/auth.ts` et `auth.service.ts`. | → `src/lib/auth/server/authEmails.ts` |
| `src/utils/bcrypt.ts` | Hachage de mot de passe rangé dans un dossier racine `utils` absent de l'architecture. | → `src/lib/auth/server/password.ts`. **Ne pas** y ajouter `server-only` ni d'alias `@/`, car `prisma/seed.ts:5` l'importe en relatif sous Node brut (`../src/utils/bcrypt.ts`). |
| `src/features/checkout/emailSender/sendReceipts.ts` | Fichier serveur (Prisma). Importé **par `src/lib`** (`lib/orders/server/checkout.service.ts:14`, `payment.service.ts:6`) : lib → features, c'est une inversion de couche. | → `src/lib/orders/server/receipts.email.ts` |
| `src/lib/services/services.service.ts` | Contient `server-only` mais n'est pas dans un sous-dossier `server/`. | → `src/lib/services/server/services.service.ts` |
| `src/features/superAdmin/constants/accountType.ts` | Règle métier (`getAccountType`, `isAccountType`) importée par `lib/users/server/user.actions.ts:10` : encore lib → features. | → `src/lib/users/accountType.ts` |

**Conflit de sens sur `services/`** :
- `features/auth/services/` contient du code serveur ;
- `features/checkout/services/checkoutApi.ts` contient du `fetch` côté client ;
- `features/services/services/addressApi.ts` est vide.

Une fois le serveur déplacé dans `lib`, `features/*/services/` voudra dire « appels API client » partout.

### 1.2 Frontière serveur / client
- **Aucun import d'exécution** de `src/lib/**/server/*.service.ts` depuis un fichier `'use client'`.
- Deux imports de **types sans `import type`**, vers des modules `server-only`, depuis des composants client. Le build passe aujourd'hui seulement parce que SWC retire les imports utilisés uniquement comme types. C'est fragile :
  - `src/features/dashboard/components/dashboard/DashboardContent.tsx:12` : `import { GroupDetails } from "@/lib/groups/server/groups.service"` ;
  - `src/features/superAdmin/components/superAdminDashboard/superAdminDashboard.tsx:16` : `import { AdminClientServices } from "@/lib/services/services.service"`.
  - Correction : passer les deux en `import type`.
- Des fichiers `*.actions.ts` (`"use server"`) sont rangés dans `server/` mais importés par des composants client (`groups.actions.ts`, `user.actions.ts`, `serviceBlock.actions.ts`). C'est légitime pour des Server Actions, mais cela contredit la règle « `server/` = serveur uniquement ». Préciser l'exception dans le CLAUDE.md, ou les déplacer dans `lib/<domaine>/actions/`.
- `src/lib/prisma.ts` n'a pas `import 'server-only'`.

### 1.3 Logique métier dans des composants ou des pages
- `fetch` écrits directement dans les composants alors qu'une couche existe pour le checkout (`checkoutApi.ts`) :
  - `dashboard/.../updateProfile.tsx:97,128` ;
  - `auth/.../ForgotPasswordForm.tsx:59,85,111` ;
  - `auth/.../RegisterForm.tsx:59` ;
  - `auth/hooks/useAuth.ts:81`.
  - Proposition : `features/auth/services/authApi.ts`.
- `CheckoutView.tsx:107` (`getIdempotencyKey`) et `:28` (`ERROR_MESSAGES`) : à sortir vers `checkoutApi.ts` ou `checkout/utils`.
- `servicesSummary/installation/installationSummary.tsx:41` : `describePlacement` est une fonction pure, exportée depuis un fichier de composant et réimportée par `RemovalSummary.tsx:2`. → `features/services/utils/placement.ts`.
- `src/app/[locale]/(protected)/dashboard/page.tsx:9` appelle `auth()` directement, sans le cache de `guard.ts`. `src/app/[locale]/(public)/services/page.tsx:11` fait de même. Pour la cohérence, passer par un helper de `guard.ts`.

### 1.4 Dépendances `shared` → `features` (shared doit rester transverse)
- `shared/components/header/header.tsx:20` importe `@/features/auth/components/authNav/AuthNav`.
- `shared/components/storageOwnerSync/StorageOwnerSync.tsx:5-6` importe les stores `cart` et `services`.
- Proposition : une feature « coquille d'application », `src/features/layout/components/{header,footer,storageOwnerSync}`.

### 1.5 Éléments de `shared` utilisés par une seule feature
Tous ces fichiers ne sont utilisés que par le checkout :

| Fichier | Seul importeur |
|---|---|
| `shared/components/cardFields/CardFields.tsx` | `CheckoutView` |
| `shared/hooks/useCardPayment.ts` | `CheckoutView`, `CardFields` |
| `shared/lib/stripeClient.ts` | `CheckoutView` |

→ `features/checkout/{components/cardFields, hooks/useCardPayment.ts, services/stripeClient.ts}`.

---

## 2. Rôle des dossiers racine de `src/`

| Dossier | Contenu réel | Verdict |
|---|---|---|
| `src/app` | Routes, `auth.ts` (config Auth.js, documentée), `antiEnumeration.test.ts` | OK. `auth.ts` peut rester, puisque le CLAUDE.md le documente. |
| `src/features` | 14 features | OK, mais contient du code serveur (§1.1). |
| `src/lib` | Logique métier et serveur | OK, sauf `lib/constants/` et `lib/validations/`, qui sont fourre-tout (voir plus bas). |
| `src/shared` | UI et utilitaires transverses | `shared/lib/` (1 fichier) est à supprimer. `shared/types/user.ts` ne fait que réexporter `UserRole`/`GroupStatus` de Prisma : importer directement depuis `@prisma/client`. |
| `src/utils` | `bcrypt.ts` seul | **À supprimer**, voir §1.1. |
| `src/types` | `next-auth.d.ts` (augmentation de module) | OK, à garder. |

Détail des dossiers fourre-tout de `src/lib` :

| Fichier | Contenu | Destination |
|---|---|---|
| `lib/constants/cart.ts` | `MAX_QUANTITY` | `lib/orders/constants.ts` |
| `lib/constants/services.ts` | `REQUEST_TYPES` | `lib/orders/constants.ts` |
| `lib/constants/labels.ts` | Libellés UI, utilisés seulement par `superAdmin/ServicesTable.tsx` | `features/superAdmin/constants/labels.ts` |
| `lib/validations/checkout.ts` | Schéma du checkout, seul fichier du dossier | `lib/orders/checkout.schema.ts`, aligné sur `lib/groups/groups.schema.ts` |

---

## 3. Duplication

| Élément | Occurrences | Proposition |
|---|---|---|
| `requireSuperAdminAction` | `lib/auth/actionGuard.ts:8`, `lib/users/server/user.actions.ts:16`, `lib/groups/server/groups.actions.ts:180` | Importer depuis `actionGuard` (comme `serviceBlock.actions.ts:6` le fait déjà). Touche l'auth : validation requise. |
| `ActionError` (classe) | `actionGuard.ts:6`, `user.actions.ts:14`, `groups.actions.ts:24` | Idem. Attention : `instanceof` ne reconnaît pas les classes d'un autre fichier, donc il faut tout unifier d'un coup. |
| `toActionError` | `actionGuard.ts:14`, `user.actions.ts:22`, plus une version inline dans `groups.actions.ts:208` | Idem. |
| `type ActionResult` | `actionGuard.ts:4`, `user.actions.ts:12`, `groups.actions.ts:21` | Idem. |
| Transporteur nodemailer | `lib/email/transporter.ts:5`, `checkout/emailSender/sendReceipts.ts:7`, `contact/emailSender/sendContact.ts:10` | Utiliser `sendEmail()`. Le test `sendContact.test.ts:6` mocke `nodemailer` et devra mocker `@/lib/email/sendEmail` à la place. |
| `formatCents` | `lib/pricing/money.ts:12` (utilisé), `shared/utils/money.ts:3` (orphelin) | Supprimer `shared/utils/money.ts`. |
| `ROLE_LABELS` | `superAdmin/constants/labels.ts:4`, `superAdmin/.../UsersTable.tsx:11` | La copie contient une **coquille** : « Administateur ». Importer depuis `labels.ts`. |
| `GROUP_STATUS_LABELS` | `superAdmin/constants/labels.ts:10` (importé dans `GroupsTable.tsx:5` mais **inutilisé**), `UsersTable.tsx:17`, plus une variante `STATUS_LABELS` dans `dashboard/.../updateGroup.tsx:29` (formulation différente, côté client) | Une seule source par public visé. |
| `getDisplayName` | `GroupsTable.tsx:17`, `UsersTable.tsx:45`, plus inline dans `UsersTable.tsx:93`, `ServiceOrders.tsx:55`, `InstallationForm.tsx:37` | `shared/utils/displayName.ts` |
| `Intl.DateTimeFormat('fr-CA', … 'America/Toronto')` | `ServiceBlockWarning.tsx:6`, `ServicesTable.tsx:5`, `UsersTable.tsx:23` | `shared/utils/date.ts` |
| Schéma du code à 6 chiffres | `ForgotPasswordForm.tsx:23`, `RegisterForm.tsx:23`, `api/custom/verify-reset-code/route.ts:6`, `api/custom/reset-password/route.ts:9`, `auth/types/index.ts:47` | `codeSchema` dans `auth.schema.ts` |
| `resetPasswordSchema` | `auth/types/index.ts:88` et redéfini dans `api/custom/reset-password/route.ts:7` | Un seul schéma, étendu avec `email` et `code`. |
| Schéma email | `ForgotPasswordForm.tsx:19` (inline) contre `forgotPasswordSchema` dans `auth/types` | Réutiliser `forgotPasswordSchema.pick({ email })`. |
| `shippingAddressSchema` | `checkout/types/index.ts:3` (formulaire), `lib/validations/checkout.ts:35` (payload) | Les formes divergent (règles et messages). À documenter ou à dériver. |
| Regex du code postal | `lib/validations/checkout.ts:23`, `shared/schemas/address.ts:4` (orphelin), plus une version plus permissive dans `AddressAutocomplete.tsx:40` | `shared/constants/postalCode.ts` |
| `SERVICE_TYPES` | `lib/pricing/constants.ts:1` (3 valeurs = enum Prisma `ServiceType`), `features/services/constants/installation.ts:1` (5 valeurs, avec `delivery` et `pickup`) | Même nom, sens différent : renommer la version UI en `SERVICE_CHOICES`. Ajouter `satisfies readonly ServiceType[]` à la version pricing. |
| `REQUEST_TYPES` | `lib/constants/services.ts:1`, double de l'enum Prisma `RequestType` | Ajouter `satisfies readonly RequestType[]`. `features/services/types/services.ts:19` peut utiliser `import type { RequestType } from '@prisma/client'`. |
| `contactSchema` | `features/contact/types/index.ts:7` et `lib/validations/checkout.ts:28` | Même nom, sens différent : renommer celui du checkout en `checkoutContactSchema`. |

---

## 4. Nommage

### 4.1 Convention majoritaire constatée
Dossier en **camelCase** et fichier composant en **PascalCase** (`cartSummary/CartSummary.tsx`).

### 4.2 Écarts : renommages de casse seule (Windows : `git mv` en deux étapes)

| Actuel | Cible |
|---|---|
| `shared/components/footer/footer.tsx`, `footer.module.css` | `Footer.tsx`, `Footer.module.css` |
| `shared/components/header/header.tsx`, `header.module.css` | `Header.tsx`, `Header.module.css` |
| `shared/components/languageSwitcher/languageSwitcher.tsx`, `.module.css` | `LanguageSwitcher.tsx`, `LanguageSwitcher.module.css` |
| `dashboard/components/updateGroup/updateGroup.tsx`, `.module.css` | `UpdateGroup.tsx`, `UpdateGroup.module.css` |
| `dashboard/components/updateProfile/updateProfile.tsx`, `.module.css` | `UpdateProfile.tsx`, `UpdateProfile.module.css` |
| `services/components/servicesSummary/installation/installationSummary.tsx` | `InstallationSummary.tsx` (son voisin s'appelle déjà `RemovalSummary.tsx`) |
| `superAdmin/components/superAdminDashboard/superAdminDashboard.tsx`, `.module.css` | `SuperAdminDashboard.tsx`, `SuperAdminDashboard.module.css` (l'export s'appelle `AdminDashboard`) |
| `services/components/placement/placementPicker.module.css` | `PlacementPicker.module.css` |

Procédure : `git mv a.tsx a.tmp.tsx && git mv a.tmp.tsx A.tsx`. Filet de sécurité : `forceConsistentCasingInFileNames` (actif par défaut en TS 5) fait échouer `tsc` si un import garde l'ancienne casse. Vercel (Linux) est sensible à la casse.

### 4.3 Écarts : dossiers (changement de chemin, `git mv` simple)

| Actuel | Cible |
|---|---|
| `auth/components/Login/LoginView`, `Login/LoginForm`, `Login/LoginCredentials` | `auth/components/loginView`, `loginForm`, `loginCredentials` |
| `auth/components/Register/RegisterView`, `RegisterCredentials`, `RegisterPackages`, `registerForm` | `auth/components/registerView`, `registerCredentials`, `registerPackages`, `registerForm` |
| `superAdmin/components/groupTable/` (contient `GroupsTable.tsx`) | `groupsTable/` |
| `dashboard/components/dashboard/` (contient `DashboardContent.tsx`) | `dashboardContent/` |

Le dossier `Register/` mélange déjà les deux casses : `RegisterView/` et `registerForm/`.

### 4.4 Autres incohérences
- **Schémas** : quatre conventions coexistent :
  - `*.schema.ts` (`features/services/schemas/`, `lib/groups/groups.schema.ts`) ;
  - `types/index.ts` contenant du Zod (`auth`, `contact`, `checkout`) ;
  - `lib/validations/checkout.ts` ;
  - `shared/schemas/address.ts`.
  - Cible : `<feature>/schemas/<nom>.schema.ts` et `lib/<domaine>/<nom>.schema.ts`.
- **Envoi d'emails** : `features/auth/services/email.ts` contre `features/*/emailSender/sendX.ts`.
- **Noms de pages copiés-collés** : `export default function CartPage` dans `bigFormat/page.tsx:6`, `contact/page.tsx:5`, `residential/page.tsx:6`.
- **Commentaires de chemin périmés en tête de fichier** :
  - `Login/LoginCredentials/LoginCredentials.tsx:1` (« RegisterCredentials.tsx ») ;
  - `Login/LoginView/LoginView.tsx:1` ;
  - `Register/RegisterCredentials/RegisterCredentials.tsx:1` ;
  - `Register/RegisterPackages/RegisterPackages.tsx:1`.
- **Composants à plat ou en dossiers** :
  - `bigFormat`, `contact`, `home`, `residential` et `shop` (4 composants et un `Shop.module.css` commun) sont à plat ; les autres features ont un dossier par composant. Acceptable pour les features à une seule vue, à documenter.
  - `removalForm/RemovalSimpleSections.tsx` regroupe 4 sections (`Keybox`, `Flags`, `Directionals`, `Other`) alors que `installationForm/` a un dossier par section.
- **Hooks** : `useX` partout. `fields/useFieldIds.ts` est dans `components/` ; acceptable car local au kit de champs.
- **Routes API** : `api/custom/{forgot-password,reset-password,verify-reset-code}`. Le nom « custom » n'informe pas, et ces routes d'auth sont séparées de `api/auth/*`. Les renommer change le contrat d'API (URL) : **validation requise**.

---

## 5. Code mort (vérifié par le graphe d'imports, alias et relatifs compris, fichiers spéciaux Next exclus)

### 5.1 Fichiers

| Fichier | Preuve | Action |
|---|---|---|
| `src/app/page.module.css` | vide, 0 import | supprimer |
| `src/features/auth/emailSender/sendRegistration.ts` | vide, 0 import | supprimer |
| `src/features/services/services/addressApi.ts` | vide, 0 import | supprimer |
| `src/shared/utils/money.ts` | 0 import ; double de `lib/pricing/money.ts` | supprimer |
| `src/shared/schemas/address.ts` | 0 import (`addressSchema`) | **à confirmer** : il valide une adresse QC complète et était peut-être prévu côté serveur |
| `src/app/[locale]/(auth)/layout.module.css` | vide mais **importé** (`(auth)/layout.tsx:2`), donc `styles.authLayout` vaut `undefined` | à remplir (tâche de style) ou retirer l'import et la classe |

### 5.2 Exports jamais importés

| Export | Fichier:ligne | Action |
|---|---|---|
| `useCartItemCount` | `features/cart/hooks/useCart.ts:38` | supprimer (le header ne l'utilise pas) |
| `createAddress`, `ServiceTypeChoice` | `features/services/types/address.ts:36`, `:2` | supprimer |
| `createRemoval`, `createCorrection` | `features/services/types/services.ts:21`, `:29` | supprimer |
| `toCents` | `lib/pricing/money.ts:2` | à confirmer (prévu pour les `Decimal` Prisma ?) |
| `requireRoleApi` | `lib/auth/guard.ts:29` | **ne pas supprimer** : aucune route ne l'utilise, ce qui est un signal sécurité à traiter dans un audit dédié |
| `createGroupAction` | `lib/groups/server/groups.actions.ts:50` | Server Action exportée donc appelable, mais jamais utilisée (`CreateGroupDialog` n'utilise que `renameGroupAction`). Fonctionnalité et auth : **à valider** avant de supprimer. |
| Types inutilisés | `VerifyEmailInput` (`auth/types:98`), `ShippingAddress` (`checkout/types:43`), `CreateGroupInput` et `AddMembersInput` (`groups.schema.ts`), `PublicUser` (`publicUser.ts`), `ProductSlug` (`products.ts:58`), `PricedServiceType` (`pricing/constants.ts:2`) | faible enjeu, supprimer ou garder comme API de type |
| `SERVICE_STATUS_LABELS` | `lib/constants/labels.ts` | importé dans `ServicesTable.tsx:3`, utilisé seulement dans du JSX commenté (`:56`) |
| `useAddresses` | `features/services/hooks/useAddresses.ts` | simple enveloppe de `useAddressStore()` (store entier, non granulaire), 1 seul appel. Candidat à la suppression (petit changement de code). |

### 5.3 Imports et variables inutilisés (ESLint, 39 avertissements)
Principaux cas :
- `Metadata` et `getTranslations` dans 4 pages publiques ;
- `Header` et `locale` dans `(public)/layout.tsx:1,8` ;
- `locale` dans `[locale]/page.tsx:9` ;
- `LoginView.tsx:5-8` (`Link`, `FaHouseChimney`, `GoogleLoginButton`, `LoginForm`) ;
- `ServiceForm.tsx:6,36` (`AddressAutocomplete`, `searchAddress`) ;
- `useLocale` dans `header`, `footer`, `CartView` et `ContactView` ;
- `IoMdCloseCircle` dans `UsersTable.tsx:7` ;
- `Order` et `Group` dans `types/next-auth.d.ts:2`.

### 5.4 Structure des routes
- `src/app/[locale]/page.tsx` (l'accueil) est **hors** de `(public)`, donc il ajoute `<Footer />` à la main.
- `(public)/layout.tsx` importe `Header` sans l'utiliser : le header est déjà rendu par `[locale]/layout.tsx:23`.
- Proposition : déplacer l'accueil dans `(public)/page.tsx` et retirer son `<Footer />`.

---

## 6. Taille

### 6.1 Les 10 plus gros fichiers de `src/`, CSS compris

| Lignes | Fichier |
|---|---|
| 552 | `features/home/components/HomeView.module.css` |
| 526 | `features/services/schemas/installation.schema.ts` |
| 514 | `features/services/schemas/installation.schema.test.ts` |
| 354 | `shared/components/header/header.module.css` |
| 348 | `features/dashboard/components/updateProfile/updateProfile.tsx` |
| 330 | `features/checkout/components/checkoutView/CheckoutView.tsx` |
| 310 | `features/dashboard/components/updateGroup/updateGroup.module.css` |
| 295 | `shared/components/addressAutocomplete/AddressAutocomplete.tsx` |
| 294 | `features/dashboard/components/updateGroup/updateGroup.tsx` |
| 287 | `features/contact/components/ContactView.module.css` |

Fichiers TS/TSX suivants : `checkout.service.ts` (266), `RegisterForm.tsx` (264), `installationSummary.tsx` (252), `ForgotPasswordForm.tsx` (252), `AddressManager.tsx` (250).

### 6.2 Découpages proposés (hors plan de déplacement, chacun avec validation)

| Fichier | Découpage |
|---|---|
| `installation.schema.ts` | `installation.schema.ts` (formes, `validate*`, `createInstallationSchema`, l. 1-365), `installation.defaults.ts` (`create*`, l. 373-431), `installation.mappers.ts` (`to*`/`from*`, `toInstallationFormValues`, l. 208-277 et 433-526). Le test suit le même découpage. |
| `updateProfile.tsx` | Deux formulaires indépendants, chacun avec son propre état : `ProfileForm.tsx`, `PasswordForm.tsx`, plus `features/auth/services/profileApi.ts` pour les deux `fetch`. |
| `updateGroup.tsx` | Trois sections, chacune avec son propre état (l. 55-63) : `GroupNameSection`, `GroupMembersSection`, `BillingModeSection`. |
| `CheckoutView.tsx` | Extraire `CheckoutForm` (l. 46+) dans son fichier, avec un `CheckoutConfirmation`. `getIdempotencyKey` et `ERROR_MESSAGES` → `checkoutApi.ts`. |
| `AddressAutocomplete.tsx` | `hasRequiredComponents` et `toPlaceResult` → `shared/utils/parsePlace.ts`. Debounce et suggestions → hook `usePlacesAutocomplete`. |
| `ForgotPasswordForm.tsx`, `RegisterForm.tsx` | Un composant par étape (`EmailStep`, `CodeStep`, `ResetStep`), avec `authApi.ts`. |
| `installationSummary.tsx` | Fonctions `describe*` → `features/services/utils/placement.ts`. |
| `AddressManager.tsx` | 9 `useState` : `StreetAddressForm` et `TerrainAddressForm`. |
| `checkout.service.ts` | Déjà bien sectionné ; découpage optionnel (`attachPaymentIntent` → `payment.service.ts`). |
| `HomeView.module.css` | Tâche de style, à découper seulement si `HomeView` est découpé en sections. |

---

## Arborescence cible de `src/`

```
src/
├── app/
│   ├── layout.tsx · page.tsx · globals.css · favicon.ico · auth.ts
│   ├── [locale]/
│   │   ├── layout.tsx
│   │   ├── (public)/ page.tsx ← ex-[locale]/page.tsx · layout.tsx · bigFormat/ cart/ contact/ residential/ services/ shop/
│   │   ├── (auth)/ (protected)/ (superAdmin)/
│   └── api/ auth/ checkout/ cron/ custom/ (renommage à valider) webhooks/
├── features/
│   ├── auth/        components/{authNav,forgotPasswordForm,googleLoginButton,loginCredentials,loginErrorMessage,
│   │                            loginForm,loginView,registerCredentials,registerForm,registerPackages,registerView}
│   │                hooks/useAuth.ts · schemas/auth.schema.ts(+test) · services/authApi.ts (futur) · store/authStore.ts
│   ├── bigFormat/ · home/ · residential/ · shop/
│   ├── cart/        components/ · hooks/ · store/ · types/
│   ├── checkout/    components/{checkoutView,cardFields} · hooks/useCardPayment.ts
│   │                schemas/checkout.schema.ts · services/{checkoutApi.ts,stripeClient.ts}
│   ├── contact/     components/ · emailSender/sendContact.ts(+test) · schemas/contact.schema.ts
│   ├── dashboard/   components/{createGroupDialog,dashboardContent,memberEmailSearch,serviceOrders,
│   │                            updateGroup/UpdateGroup.tsx,updateProfile/UpdateProfile.tsx}
│   ├── layout/      components/{header/Header.tsx,footer/Footer.tsx,storageOwnerSync/}
│   ├── services/    components/… (servicesSummary/installation/InstallationSummary.tsx)
│   │                constants/ · schemas/ · store/ · types/ · utils/{placement.ts,…}
│   └── superAdmin/  components/{groupsTable,servicesTable,superAdminDashboard/SuperAdminDashboard.tsx,usersTable}
│                    constants/labels.ts (fusion avec lib/constants/labels.ts)
├── lib/
│   ├── prisma.ts
│   ├── auth/        guard.ts · actionGuard.ts · server/{auth.service.ts(+test),authEmails.ts,password.ts}
│   ├── catalog/ · email/ · errors/ · pricing/ · stripe/
│   ├── groups/      groups.schema.ts · server/
│   ├── orders/      billing.ts · checkout.schema.ts · constants.ts (MAX_QUANTITY, REQUEST_TYPES)
│   │                server/{…, receipts.email.ts}
│   ├── services/    server/services.service.ts
│   └── users/       accountType.ts · publicUser.ts · server/
├── shared/
│   ├── components/  addressAutocomplete/ · languageSwitcher/LanguageSwitcher.tsx · LocalLink.tsx
│   ├── constants/   locales.ts
│   ├── hooks/       useAppLocale.ts
│   ├── types/       address.ts
│   └── utils/       googleMapsLoader.ts · normalize.ts · parsePlace.ts · pathname.ts · (displayName.ts, date.ts : phase 8)
├── types/next-auth.d.ts
├── i18n.ts
└── middleware.ts
```

Dossiers qui disparaissent : `src/utils/`, `src/shared/lib/`, `src/shared/schemas/`, `src/lib/constants/`, `src/lib/validations/`, `features/auth/emailSender/`, `features/auth/types/`, `features/services/services/`, `features/{contact,checkout}/types/`.

---

## Plan en phases

Règles communes à chaque phase :
- un commit par phase, déplacements avec `git mv`, aucun changement de logique (sauf en phase 8, signalée) ;
- après chaque phase : `npx tsc --noEmit`, `npm run lint`, `npm run test:run`, `npm run build` ;
- **piège** : les chaînes `vi.mock("…")` et `await import("…")` des tests ne sont **pas vérifiées par `tsc`**. Toujours lancer `grep -rn "vi.mock\|await import" src` après un déplacement.

### Phase 1 : Suppression des fichiers morts (risque **faible**)
- Supprimés :
  - `src/app/page.module.css` ;
  - `src/features/auth/emailSender/sendRegistration.ts` ;
  - `src/features/services/services/addressApi.ts` ;
  - `src/shared/utils/money.ts`.
- `src/shared/schemas/address.ts` : seulement après confirmation.
- Imports à mettre à jour : **0**.
- Justification : fichiers vides ou orphelins, vérifiés par le graphe.

### Phase 2 : Renommages de casse seule (risque **faible à moyen**)
- Fichiers renommés (§4.2) :
  - `footer.tsx` et sa CSS, `header.tsx` et sa CSS, `languageSwitcher.tsx` et sa CSS ;
  - `updateGroup.tsx` et sa CSS, `updateProfile.tsx` et sa CSS ;
  - `installationSummary.tsx` ;
  - `superAdminDashboard.tsx` et sa CSS ;
  - `placementPicker.module.css`.
- `git mv` en deux étapes pour chacun.
- Imports à mettre à jour : **environ 22** :
  - `footer` : 4 ;
  - `header` : 2 (dont 1 inutilisé) ;
  - `languageSwitcher` : 1 ;
  - `updateGroup` et `updateProfile` : 2 ;
  - `installationSummary` : 2 ;
  - `superAdminDashboard` : 1 ;
  - imports CSS internes : 8.
- Risque : casse ignorée par Windows et `core.ignorecase`. Vérifier que `git status` affiche bien `R` avec la nouvelle casse. `tsc` (`forceConsistentCasingInFileNames`) et le build Vercel sous Linux détectent les oublis.

### Phase 3 : Dossiers de composants (risque **moyen**)
- Déplacés :
  - `auth/components/Login/{LoginView,LoginForm,LoginCredentials}` → `auth/components/{loginView,loginForm,loginCredentials}` ;
  - `auth/components/Register/{RegisterView,RegisterCredentials,RegisterPackages,registerForm}` → `auth/components/{registerView,registerCredentials,registerPackages,registerForm}` ;
  - `superAdmin/components/groupTable` → `groupsTable` ;
  - `dashboard/components/dashboard` → `dashboardContent`.
- Imports à mettre à jour : **environ 40** (15 imports entrants vers les composants auth, environ 18 imports relatifs sortants en `../../../` dont la profondeur change, 3 et 5 pour superAdmin et dashboard).
- Risque : de nombreux chemins relatifs à recalculer ; `tsc` les détecte tous.

### Phase 4 : Code serveur dans `lib` (risque **moyen à élevé**)
- Déplacés :
  - `features/auth/services/auth.service.ts` et `auth.service.test.ts` → `lib/auth/server/` ;
  - `features/auth/services/email.ts` → `lib/auth/server/authEmails.ts` ;
  - `src/utils/bcrypt.ts` → `lib/auth/server/password.ts` (sans `server-only`) ;
  - `features/checkout/emailSender/sendReceipts.ts` → `lib/orders/server/receipts.email.ts` ;
  - `lib/services/services.service.ts` → `lib/services/server/services.service.ts`.
- Plus `import type` dans `DashboardContent.tsx:12` et `superAdminDashboard.tsx:16` (modification d'un mot).
- Imports à mettre à jour : **environ 30**, dont **6 chaînes de test non vérifiées par `tsc`** :
  - `auth.service` : 7 routes et 1 test ;
  - `email` : 2 imports, plus `vi.mock` dans `antiEnumeration.test.ts:33` et `auth.service.test.ts:21` ;
  - `bcrypt` : 4 imports, dont `prisma/seed.ts:5` en relatif avec `.ts`, plus `vi.mock` dans `antiEnumeration.test.ts:32`, `auth.service.test.ts:17` et `await import` dans `auth.service.test.ts:96` ;
  - `sendReceipts` : 2 ;
  - `services.service` : 3.
- Risque :
  - une chaîne `vi.mock` oubliée fait charger le vrai Prisma dans les tests ;
  - `seed.ts` s'exécute sous Node brut : `password.ts` ne doit importer ni `server-only` ni d'alias `@/`.
- Mettre à jour le CLAUDE.md (§Architecture) dans le même commit.

### Phase 5 : Schémas et constantes (risque **faible à moyen**)
- Déplacés :
  - `features/auth/types/index.ts` et `index.test.ts` → `features/auth/schemas/auth.schema.ts` et `auth.schema.test.ts` ;
  - `features/contact/types/index.ts` → `features/contact/schemas/contact.schema.ts` ;
  - `features/checkout/types/index.ts` → `features/checkout/schemas/checkout.schema.ts` ;
  - `lib/validations/checkout.ts` → `lib/orders/checkout.schema.ts` ;
  - `lib/constants/cart.ts` et `lib/constants/services.ts` → `lib/orders/constants.ts` (concaténation) ;
  - `lib/constants/labels.ts` → fusion dans `features/superAdmin/constants/labels.ts` ;
  - `features/superAdmin/constants/accountType.ts` → `lib/users/accountType.ts`.
- Imports à mettre à jour : **environ 32** (auth/types 15, contact 3, checkout/types 2, validations 3, cart 3, services 2, labels 1, accountType 3).
- Risque : aucun mock de test concerné, `tsc` détecte tout. Les fusions de fichiers sont du copier-coller pur.

### Phase 6 : Réaffectation `shared` / `features` (risque **faible**)
- Déplacés :
  - `shared/components/cardFields/` → `features/checkout/components/cardFields/` ;
  - `shared/hooks/useCardPayment.ts` → `features/checkout/hooks/` ;
  - `shared/lib/stripeClient.ts` → `features/checkout/services/stripeClient.ts` ;
  - `shared/components/{header,footer,storageOwnerSync}` → `features/layout/components/` ;
  - `describePlacement` → `features/services/utils/placement.ts` (extraction d'une fonction pure).
- Supprimé : `shared/types/user.ts` (importer depuis `@prisma/client`).
- Imports à mettre à jour : **environ 17** (checkout 4, footer 4, header 2, `StorageOwnerSync` 1, `languageSwitcher` relatif 1, `describePlacement` 2, `user` 2, plus les chemins internes).
- Faire passer la phase 2 avant, pour ne renommer qu'une fois.

### Phase 7 : Nettoyage des routes et des imports morts (risque **faible**, petits changements de code)
- `src/app/[locale]/page.tsx` → `src/app/[locale]/(public)/page.tsx`, en retirant son `<Footer />` (déjà fourni par le layout).
- Retirer les 39 imports ou variables inutilisés signalés par ESLint.
- Renommer les `CartPage` copiés-collés.
- Supprimer les exports morts (§5.2 : `useCartItemCount`, `createAddress`, `ServiceTypeChoice`, `createRemoval`, `createCorrection`).
- Corriger les 4 commentaires de chemin périmés.
- Imports à mettre à jour : **environ 0** (suppressions locales).
- Risque : rendu de l'accueil à vérifier visuellement (footer en double ou absent).

### Phase 8 : Dédoublonnage (**changements de code, validation requise**, risque **moyen**)
À faire en plusieurs commits :
- **8a (auth : validation obligatoire)** : `user.actions.ts` et `groups.actions.ts` importent `requireSuperAdminAction`, `ActionError`, `toActionError` et `ActionResult` depuis `actionGuard.ts`. Tests : étendre `groups.actions.test.ts` et en ajouter un pour `user.actions`.
- **8b** : `sendReceipts` et `sendContact` passent par `lib/email/sendEmail`. Adapter le mock de `sendContact.test.ts:6`.
- **8c** :
  - libellés `ROLE_LABELS` et `GROUP_STATUS_LABELS` uniques (corrige au passage la coquille « Administateur ») ;
  - `shared/utils/displayName.ts` ;
  - `shared/utils/date.ts` ;
  - `codeSchema` et `resetPasswordSchema` uniques dans `auth.schema.ts` (utilisés par les routes `api/custom/*` et les formulaires) ;
  - renommer `SERVICE_TYPES` (UI) en `SERVICE_CHOICES` et `contactSchema` (checkout) en `checkoutContactSchema`.
- Environ 25 fichiers touchés au total.

### Hors plan (décision de l'utilisateur requise)
- Suppression de `createGroupAction` (Server Action exposée mais inutilisée) et sort de `requireRoleApi` (à adopter dans les routes plutôt qu'à supprimer).
- Renommage de `api/custom/*` (contrat d'API).
- Découpages du §6.2.
- Ajout de `server-only` à `lib/prisma.ts`.
- Sort de `shared/schemas/address.ts` et de `toCents`.
- Absence de `error.tsx`, `not-found.tsx` et `loading.tsx` dans `src/app/[locale]`, et absence de namespaces i18n pour `dashboard`, `services` et `superAdmin` (textes en français codés en dur). C'est hors du périmètre structure, mais visible dans l'arborescence.
