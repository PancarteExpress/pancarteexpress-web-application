export const getActivePath = (pathname: string) => {
  return pathname.replace(/^\/(en|fr)/, '') || '/';
};

/**
 * URL cible d'un changement de langue : remplace le préfixe de locale du chemin
 * et conserve la query string et le hash (`search` et `hash` incluent leur « ? » / « # »).
 */
export const buildLocaleUrl = (
  pathname: string,
  search: string,
  hash: string,
  from: string,
  to: string,
) => {
  const prefix = `/${from}`;
  const rest = pathname === prefix || pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname;
  return `/${to}${rest}${search}${hash}`;
};
