/** Poignée exposée par un formulaire de service à son parent */
export interface ServiceFormHandle<TDetails> {
  /** Valide le formulaire et affiche ses erreurs ; renvoie les données ou null si invalide */
  submit: () => Promise<TDetails | null>;
}