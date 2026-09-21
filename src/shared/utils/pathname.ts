export const getActivePath = (pathname: string) => {
  return pathname.replace(/^\/(en|fr)/, '') || '/';
};