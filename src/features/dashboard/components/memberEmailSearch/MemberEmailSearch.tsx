"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { searchUsersByEmailAction, type UserSearchResult } from "@/lib/groups/server/groups.actions";
import styles from "./MemberEmailSearch.module.css";

import { IoMdCloseCircle } from "react-icons/io";

interface Props {
  selected: UserSearchResult[];
  onChange: (next: UserSearchResult[]) => void;
}

const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;

export function MemberEmailSearch({ selected, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < MIN_CHARS) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await searchUsersByEmailAction(q);
        if (!cancelled) setResults(users);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    // Annule le timer + ignore les réponses obsolètes
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const selectedIds = new Set(selected.map((u) => u.id));
  const visibleResults = results.filter((u) => !selectedIds.has(u.id));

  const add = (user: UserSearchResult) => {
    onChange([...selected, user]);
    setQuery("");
  };

  const remove = (id: string) => onChange(selected.filter((u) => u.id !== id));

  // Empêche Entrée de soumettre le formulaire parent
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.preventDefault();
  };

  return (
    <div className={styles.container}>

      <div className={styles.input}>
        <label htmlFor="member-email">Courriel des coéquipiers</label>
        <input
          id="member-email"
          type="email"
          autoComplete="off"
          placeholder="Rechercher par courriel…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className={styles.results}>

        {isSearching && <p className={styles.search}>Recherche…</p>}

        {!isSearching && query.trim().length >= MIN_CHARS && visibleResults.length === 0 && (
          <p className={styles.notFound}>Aucun utilisateur disponible</p>
        )}

        {visibleResults.length > 0 && (
          <ul className={styles.listFound}>
            {visibleResults.map((user) => (
              <li key={user.id}>
                <button className={styles.btnAdd} type="button" onClick={() => add(user)}>
                  <span>{user.email}</span> : 
                  <span className={styles.name}>{user.firstName} {user.lastName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {selected.length > 0 && (
          <ul className={styles.listAdded}>
            {selected.map((user) => (
              <li key={user.id}>
                {user.email}
                <button className={styles.btnDelete} type="button" onClick={() => remove(user.id)} aria-label={`Retirer ${user.email}`}>
                <IoMdCloseCircle size={20} style={{ color: 'red' }} />
                </button>
              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  );
}