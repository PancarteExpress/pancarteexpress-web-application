# Pancarte Express — guide pour Claude Code

## Stack (versions réelles, voir package.json)

- Next.js 15.5 (App Router, Turbopack) · React 19.1 · TypeScript 5 (`strict: true`)
- Prisma 6.19 + PostgreSQL (Neon serverless) · Auth.js v5 beta (`next-auth`, Google + Credentials/bcrypt, session JWT) — config dans `src/app/auth.ts`
- next-intl 4 · Zustand 5 · React Hook Form 7 + Zod 4 · Stripe · Nodemailer · date-fns · framer-motion
- Styles : CSS Modules (pas de Tailwind)
- Tests : Vitest 5, environnement `node`, fichiers `src/**/*.test.{ts,tsx}`
- Déploiement : Vercel (branche `staging`, cron quotidien `/api/cron/cleanup-orders` dans `vercel.json`)

## Commandes

```bash
npm run dev            # next dev --turbopack
npm run build          # prisma generate && next build --turbopack
npm run lint           # eslint (next/core-web-vitals + next/typescript)
npm run test:run       # vitest run — à utiliser par Claude Code
npm test               # vitest en watch — usage humain uniquement
npx tsc --noEmit       # vérification des types
npx prisma generate    # régénérer le client (aussi en postinstall)
npx prisma migrate dev --name <nom>   # nouvelle migration (dev uniquement)
```

- Toujours utiliser `npm run test:run`, jamais `npm test` (le mode watch bloque la session)
- `push-env.ps1` envoie `.env.local` vers Vercel (`./push-env.ps1 -Target production|development`) — ne jamais l'exécuter sans demande explicite

## Architecture

- `src/app/[locale]/` — routes par groupes : `(public)`, `(auth)`, `(protected)`, `(superAdmin)` ; `src/app/api/` — route handlers (auth, checkout, cron, webhooks…)
- `src/features/<feature>/{components,hooks,services,store,types}` (+ `schemas`, `constants`, `utils`, `emailSender` au besoin) ; `services/` = appels API côté client
- `src/shared/` — composants, hooks, constantes et utilitaires transverses
- `src/lib/` — logique serveur et métier (auth guards, pricing, orders, groups, users, stripe, email) ; les sous-dossiers `server/` sont serveur uniquement (`import "server-only"`), sauf les Server Actions `*.actions.ts` (`"use server"`) appelables depuis le client
- Code serveur (Prisma, bcrypt, envoi d'emails) dans `src/lib/<domaine>/server/`, jamais dans `src/features` ; `src/lib` n'importe jamais depuis `src/features`
- Schémas Zod : `<nom>.schema.ts` ; partagés client/serveur dans `src/lib/<domaine>/` (ex. `lib/auth/auth.schema.ts`), propres à une feature dans `src/features/<feature>/schemas/`
- `src/lib/auth/server/password.ts` : ni `server-only` ni alias `@/` (importé en relatif par `prisma/seed.ts` sous Node brut)
- `src/middleware.ts` — routage i18n uniquement (préfixe de locale obligatoire) ; **aucune protection d'auth** : elle repose entièrement sur les guards
- Alias : `@/*` → `src/*`, `@/messages/*` → `messages/*`

## Conventions

- TypeScript strict, aucun `any` : `unknown` + narrowing, types dérivés de Zod (`z.infer`) ou de Prisma
- Server Components par défaut ; `'use client'` seulement si nécessaire, le plus bas possible dans l'arbre
- Composants de formulaire contrôlés : props `data` + `onChange` ; un seul `onChange(newData)` par mise à jour
- `useEffect` : dépendances minimales et stables (pas d'objets/callbacks recréés à chaque rendu)
- Hooks jamais après un `return` conditionnel
- Next 15 : `params` / `searchParams` typés `Promise<{...}>` et `await`és (pages, layouts, route handlers)
- Tableaux d'objets : `Array.from({ length: n }, () => ({}))`, jamais `Array(n).fill({})`

## Sécurité

- Autorisation vérifiée côté serveur (`src/lib/auth/guard.ts`, `actionGuard.ts`) sur chaque page protégée, route API et Server Action — jamais seulement côté client
- Toute route API / Server Action valide ses entrées avec Zod côté serveur
- Vérifier l'appartenance des ressources (un user n'accède qu'à ses données, un groupAdmin qu'à son groupe)
- Montants et prix calculés côté serveur uniquement ; webhooks Stripe vérifiés par signature
- Aucune donnée sensible (hash, tokens) renvoyée au client

## Rôles

Enum Prisma `UserRole` : `user`, `groupAdmin`, `superAdmin` (défaut `user`).
- `groupAdmin` : leader d'un groupe de courtiers
- `superAdmin` : compte unique, connexion email/mot de passe seulement, seul accès à `(superAdmin)`

## i18n

- next-intl, locales `fr` (défaut) et `en` — `src/shared/constants/locales.ts`
- Messages par namespace : `messages/{fr,en}/<namespace>.json`, déclarés dans `LOADERS` de `src/i18n.ts` (un nouveau namespace = une ligne)
- Aucun texte codé en dur dans l'UI : `useTranslations` / `getTranslations`
- Toute nouvelle clé ajoutée dans `fr` ET `en`, mêmes clés
- Fuseau horaire : `America/Toronto`

## Tests

- Logique serveur : environnement `node` par défaut
- Pas d'environnement DOM installé (ni jsdom ni React Testing Library) : tests de composants React non disponibles, demander avant d'en ajouter ou de modifier `vitest.config.mts`
- Tout bug corrigé dans une logique critique (auth, rôles, paiement, pricing) reçoit un test

## Avant le lancement en production

Le site n'est pas encore en production : une seule base Neon, aucune donnée réelle sauf le compte superAdmin. À faire avant le lancement :

- Séparer dev et prod en deux branches Neon (URLs distinctes dans les environnements Vercel `development`/`preview` et `production`)
- Ajouter `prisma migrate deploy` au build Vercel de production uniquement (jamais `migrate dev` sur la base de prod)
- Créer le superAdmin sur la base de prod : `SUPERADMIN_EMAIL` et `SUPERADMIN_PASSWORD` dans l'environnement, puis `npx prisma db seed` (`prisma/seed.ts`, idempotent, refuse un second superAdmin). La CLI Prisma ne lit pas `.env.local` : charger les variables dans le shell avant. Ne jamais l'exécuter sans demande explicite
- Rate limiting (audit É4) : créer le compte Upstash et ajouter `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` aux variables d'env, puis brancher `@upstash/ratelimit` sur login, inscription, codes, mot de passe, contact, checkout et recherche de membres
- Pagination (audit performance D-G, `docs/audits/performance-2026-11.md`) : ajouter `take` et pagination, ou chargement par onglet, aux listes admin et à l'historique, aujourd'hui sans limite (`orders.service.ts`, `user.service.ts`, `groups.service.ts`, `services.service.ts`)

## Règles de travail

- Diffs minimaux, corriger la cause racine
- Tâche logique → ne pas toucher au style ; tâche de style → ne pas toucher à la logique
- Ne jamais modifier une migration Prisma existante
- Ne pas ajouter de dépendance sans justification et validation
- Après modification : `npx tsc --noEmit`, `npm run lint`, `npm run test:run`
- Si une info manque, poser la question plutôt que supposer
- Réponses concises, en français