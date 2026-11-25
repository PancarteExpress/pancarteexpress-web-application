"use client";

import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import {
  searchUsersByEmailAction,
  type MemberSearchError,
  type UserSearchResult,
} from "@/lib/groups/server/groups.actions";
import styles from "./MemberEmailSearch.module.css";

import { IoMdCloseCircle } from "react-icons/io";

interface Props {
  selected: UserSearchResult[];
  onChange: (next: UserSearchResult[]) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalize = (value: string) => value.trim().toLowerCase();

export function MemberEmailSearch({ selected, onChange }: Props) {
  const t = useTranslations("groups.memberSearch");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);
  const [error, setError] = useState<MemberSearchError | "generic" | null>(null);

  const q = normalize(query);
  // Résultats et messages valables seulement pour le texte réellement cherché
  const isCurrent = searchedQuery === q;

  const search = async () => {
    if (!EMAIL_PATTERN.test(q) || isSearching) return;
    setIsSearching(true);
    setError(null);
    try {
      const res = await searchUsersByEmailAction(q);
      if (res.ok) {
        setResults(res.users);
      } else {
        setResults([]);
        setError(res.error);
      }
    } catch {
      setResults([]);
      setError("generic");
    } finally {
      setSearchedQuery(q);
      setIsSearching(false);
    }
  };

  const selectedIds = new Set(selected.map((u) => u.id));
  const visibleResults = isCurrent ? results.filter((u) => !selectedIds.has(u.id)) : [];

  const add = (user: UserSearchResult) => {
    onChange([...selected, user]);
    setQuery("");
    setResults([]);
    setSearchedQuery(null);
  };

  const remove = (id: string) => onChange(selected.filter((u) => u.id !== id));

  // Entrée lance la recherche au lieu de soumettre le formulaire parent
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void search();
    }
  };

  return (
    <div className={styles.container}>

      <div className={styles.input}>
        <label htmlFor="member-email">{t("label")}</label>
        <input
          id="member-email"
          type="email"
          autoComplete="off"
          placeholder={t("placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" onClick={search} disabled={!EMAIL_PATTERN.test(q) || isSearching}>
          {t("searchButton")}
        </button>
      </div>

      <div className={styles.results}>

        {isSearching && <p className={styles.search}>{t("searching")}</p>}

        {!isSearching && isCurrent && error && (
          <p className={styles.notFound}>{t(`errors.${error}`)}</p>
        )}

        {!isSearching && isCurrent && !error && visibleResults.length === 0 && (
          <p className={styles.notFound}>{t("notFound")}</p>
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
                <button className={styles.btnDelete} type="button" onClick={() => remove(user.id)} aria-label={t("remove", { email: user.email })}>
                  <IoMdCloseCircle size={20} style={{ color: "red" }} />
                </button>
              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  );
}